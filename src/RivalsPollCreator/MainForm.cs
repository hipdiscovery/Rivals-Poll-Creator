using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace RivalsPollCreator;

public sealed class MainForm : Form
{
    private static readonly HashSet<string> ImageExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".png", ".jpg", ".jpeg", ".webp" };

    private readonly WebView2 _webView = new() { Dock = DockStyle.Fill };
    private readonly NativeOcrService _ocr = new();

    public MainForm()
    {
        Text = "Rivals Poll Creator";
        Width = 1280;
        Height = 900;
        MinimumSize = new Size(980, 700);
        StartPosition = FormStartPosition.CenterScreen;
        Icon = new Icon(Path.Combine(AppContext.BaseDirectory, "app.ico"));
        Controls.Add(_webView);
        Shown += async (_, _) => await StartAsync();
    }

    private async Task StartAsync()
    {
        try
        {
            string dataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Rivals Poll Creator",
                "WebView2");
            Directory.CreateDirectory(dataFolder);

            CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(
                userDataFolder: dataFolder);
            await _webView.EnsureCoreWebView2Async(environment);

            string webRoot = Path.Combine(AppContext.BaseDirectory, "www");
            string indexPath = Path.Combine(webRoot, "index.html");
            if (!File.Exists(indexPath))
            {
                throw new FileNotFoundException("The application web files are missing.", indexPath);
            }

            _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "rivals.poll",
                webRoot,
                CoreWebView2HostResourceAccessKind.DenyCors);
            _webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _webView.CoreWebView2.WebMessageReceived += HandleMessage;
            _webView.CoreWebView2.DownloadStarting += HandleDownloadStarting;
            _webView.CoreWebView2.NavigationStarting += (_, args) =>
            {
                if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out Uri? uri) ||
                    !string.Equals(uri.Host, "rivals.poll", StringComparison.OrdinalIgnoreCase))
                {
                    args.Cancel = true;
                }
            };
            _webView.Source = new Uri("https://rivals.poll/index.html");
        }
        catch (WebView2RuntimeNotFoundException)
        {
            MessageBox.Show(
                "This PC needs the Microsoft Edge WebView2 Runtime. Install it from Microsoft, then open the app again.",
                Text,
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            Close();
        }
        catch (Exception exception)
        {
            MessageBox.Show(
                $"Rivals Poll Creator could not start.\n\n{exception.Message}",
                Text,
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            Close();
        }
    }

    private static void HandleDownloadStarting(
        object? sender,
        CoreWebView2DownloadStartingEventArgs args)
    {
        string exportFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            "OneDrive",
            "Pictures",
            "Marvel Polls");
        Directory.CreateDirectory(exportFolder);

        string requestedName = Path.GetFileName(args.ResultFilePath);
        if (string.IsNullOrWhiteSpace(requestedName))
        {
            requestedName = "Rivals Poll.zip";
        }

        string destination = Path.Combine(exportFolder, requestedName);
        if (File.Exists(destination))
        {
            string stem = Path.GetFileNameWithoutExtension(requestedName);
            string extension = Path.GetExtension(requestedName);
            for (int index = 2; File.Exists(destination); index++)
            {
                destination = Path.Combine(exportFolder, $"{stem} ({index}){extension}");
            }
        }

        args.ResultFilePath = destination;
        args.Handled = true;
    }

    private async void HandleMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        try
        {
            if (!Uri.TryCreate(args.Source, UriKind.Absolute, out Uri? source) ||
                !string.Equals(source.Host, "rivals.poll", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            using JsonDocument message = ParseMessage(args.WebMessageAsJson);
            JsonElement root = message.RootElement;
            if (!root.TryGetProperty("cmd", out JsonElement commandElement))
            {
                return;
            }

            string? command = commandElement.GetString();
            if (string.Equals(command, "ocr", StringComparison.Ordinal))
            {
                await HandleOcrAsync(root);
            }
            else if (string.Equals(command, "delete", StringComparison.Ordinal))
            {
                DeleteScreenshot(root);
            }
        }
        catch
        {
            // Malformed or stale web messages are ignored. The browser fallback remains available.
        }
    }

    private static JsonDocument ParseMessage(string json)
    {
        JsonDocument outer = JsonDocument.Parse(json);
        if (outer.RootElement.ValueKind != JsonValueKind.String)
        {
            return outer;
        }

        string inner = outer.RootElement.GetString() ?? "{}";
        outer.Dispose();
        return JsonDocument.Parse(inner);
    }

    private async Task HandleOcrAsync(JsonElement message)
    {
        string requestId = message.TryGetProperty("requestId", out JsonElement idElement)
            ? idElement.GetString() ?? string.Empty
            : string.Empty;
        string dataUrl = message.TryGetProperty("dataUrl", out JsonElement dataElement)
            ? dataElement.GetString() ?? string.Empty
            : string.Empty;

        string text = string.Empty;
        string? error = null;
        try
        {
            const string prefix = "data:image/png;base64,";
            if (requestId.Length is < 1 or > 80 ||
                !dataUrl.StartsWith(prefix, StringComparison.Ordinal) ||
                dataUrl.Length > 24_000_000)
            {
                throw new InvalidDataException("Invalid OCR image request.");
            }

            byte[] imageBytes = Convert.FromBase64String(dataUrl[prefix.Length..]);
            text = await _ocr.RecognizePngAsync(imageBytes);
        }
        catch (Exception exception)
        {
            error = exception.Message;
        }

        string response = JsonSerializer.Serialize(new
        {
            cmd = "ocr-result",
            requestId,
            text,
            error
        });
        _webView.CoreWebView2.PostWebMessageAsJson(response);
    }

    private static void DeleteScreenshot(JsonElement message)
    {
        string? fileName = message.TryGetProperty("fileName", out JsonElement nameElement)
            ? nameElement.GetString()
            : null;
        string? suppliedPath = message.TryGetProperty("filePath", out JsonElement pathElement)
            ? pathElement.GetString()
            : null;

        if (string.IsNullOrWhiteSpace(fileName) ||
            fileName != Path.GetFileName(fileName) ||
            !ImageExtensions.Contains(Path.GetExtension(fileName)))
        {
            return;
        }

        IEnumerable<string> candidates = string.IsNullOrWhiteSpace(suppliedPath)
            ? ScreenshotFolders().Select(folder => Path.Combine(folder, fileName))
            : new[] { suppliedPath };

        foreach (string candidate in candidates)
        {
            string fullPath;
            try
            {
                fullPath = Path.GetFullPath(candidate);
            }
            catch
            {
                continue;
            }

            if (!string.Equals(Path.GetFileName(fullPath), fileName, StringComparison.OrdinalIgnoreCase) ||
                !IsInsidePictures(fullPath) ||
                !File.Exists(fullPath))
            {
                continue;
            }

            File.Delete(fullPath);
            return;
        }
    }

    private static bool IsInsidePictures(string filePath)
    {
        string pictures = Path.GetFullPath(
            Environment.GetFolderPath(Environment.SpecialFolder.MyPictures))
            .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        string oneDrivePictures = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            "OneDrive",
            "Pictures");
        oneDrivePictures = Path.GetFullPath(oneDrivePictures)
            .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

        return filePath.StartsWith(pictures, StringComparison.OrdinalIgnoreCase) ||
               filePath.StartsWith(oneDrivePictures, StringComparison.OrdinalIgnoreCase);
    }

    private static IEnumerable<string> ScreenshotFolders()
    {
        yield return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyPictures),
            "Screenshots");
        yield return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            "OneDrive",
            "Pictures",
            "Screenshots");
    }
}
