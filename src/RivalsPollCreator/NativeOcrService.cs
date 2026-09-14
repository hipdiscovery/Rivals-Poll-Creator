using Windows.Globalization;
using Windows.Graphics.Imaging;
using Windows.Media.Ocr;
using Windows.Storage.Streams;

namespace RivalsPollCreator;

public sealed class NativeOcrService
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly OcrEngine? _engine =
        OcrEngine.TryCreateFromLanguage(new Language("en-US")) ??
        OcrEngine.TryCreateFromUserProfileLanguages();

    public async Task<string> RecognizePngAsync(byte[] pngBytes)
    {
        ArgumentNullException.ThrowIfNull(pngBytes);
        if (pngBytes.Length == 0)
        {
            return string.Empty;
        }

        return await RecognizeRegionsAsync(pngBytes, new NormalizedCrop(0, 0, 1, 1));
    }

    public async Task<string> RecognizeFileCropAsync(string filePath, NormalizedCrop crop)
    {
        byte[] bytes = await File.ReadAllBytesAsync(filePath);
        return await RecognizeRegionsAsync(bytes, crop);
    }

    private async Task<string> RecognizeRegionsAsync(byte[] bytes, NormalizedCrop outerCrop)
    {
        NormalizedCrop[] regions =
        {
            outerCrop,
            Compose(outerCrop, new NormalizedCrop(0.40, 0.12, 0.60, 0.52)),
            Compose(outerCrop, new NormalizedCrop(0.00, 0.30, 0.96, 0.48)),
            Compose(outerCrop, new NormalizedCrop(0.45, 0.18, 0.50, 0.36))
        };
        List<string> results = new(regions.Length);
        foreach (NormalizedCrop region in regions)
        {
            string result = await RecognizeRegionAsync(bytes, region);
            foreach (string line in result.Split(
                         new[] { "\r\n", "\n" },
                         StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (!results.Contains(line, StringComparer.OrdinalIgnoreCase))
                {
                    results.Add(line);
                }
            }
        }

        return string.Join(Environment.NewLine, results);
    }

    private async Task<string> RecognizeRegionAsync(byte[] bytes, NormalizedCrop crop)
    {
        using InMemoryRandomAccessStream stream = await CreateStreamAsync(bytes);
        BitmapDecoder decoder = await BitmapDecoder.CreateAsync(stream);
        uint x = (uint)Math.Clamp(Math.Round(decoder.PixelWidth * crop.X), 0, decoder.PixelWidth - 1);
        uint y = (uint)Math.Clamp(Math.Round(decoder.PixelHeight * crop.Y), 0, decoder.PixelHeight - 1);
        uint width = (uint)Math.Clamp(Math.Round(decoder.PixelWidth * crop.Width), 1, decoder.PixelWidth - x);
        uint height = (uint)Math.Clamp(Math.Round(decoder.PixelHeight * crop.Height), 1, decoder.PixelHeight - y);
        BitmapTransform transform = new()
        {
            Bounds = new BitmapBounds { X = x, Y = y, Width = width, Height = height }
        };
        using SoftwareBitmap bitmap = await decoder.GetSoftwareBitmapAsync(
            BitmapPixelFormat.Bgra8,
            BitmapAlphaMode.Premultiplied,
            transform,
            ExifOrientationMode.RespectExifOrientation,
            ColorManagementMode.ColorManageToSRgb);
        return await RecognizeBitmapAsync(bitmap);
    }

    private static NormalizedCrop Compose(NormalizedCrop outer, NormalizedCrop inner) => new(
        outer.X + outer.Width * inner.X,
        outer.Y + outer.Height * inner.Y,
        outer.Width * inner.Width,
        outer.Height * inner.Height);

    private static async Task<InMemoryRandomAccessStream> CreateStreamAsync(byte[] bytes)
    {
        InMemoryRandomAccessStream stream = new();
        using IOutputStream output = stream.GetOutputStreamAt(0);
        using DataWriter writer = new(output);
        writer.WriteBytes(bytes);
        await writer.StoreAsync();
        await output.FlushAsync();
        writer.DetachStream();
        stream.Seek(0);
        return stream;
    }

    private async Task<string> RecognizeBitmapAsync(SoftwareBitmap bitmap)
    {
        if (_engine is null)
        {
            throw new InvalidOperationException("Windows English OCR is not available.");
        }

        if (bitmap.PixelWidth > OcrEngine.MaxImageDimension ||
            bitmap.PixelHeight > OcrEngine.MaxImageDimension)
        {
            throw new InvalidDataException("The OCR crop is too large.");
        }

        await _gate.WaitAsync();
        try
        {
            OcrResult result = await _engine.RecognizeAsync(bitmap);
            return string.Join(
                Environment.NewLine,
                result.Lines.Select(line => string.Join(" ", line.Words.Select(word => word.Text))))
                .Trim();
        }
        finally
        {
            _gate.Release();
        }
    }
}

public readonly record struct NormalizedCrop(double X, double Y, double Width, double Height);
