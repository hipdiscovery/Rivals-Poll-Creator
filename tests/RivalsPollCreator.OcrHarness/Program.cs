using System.Text.Json;
using RivalsPollCreator;

if (args.Length != 2)
{
    Console.Error.WriteLine("Usage: OcrHarness <manifest.json> <screenshots-folder>");
    return 2;
}

List<TestCase>? tests = JsonSerializer.Deserialize<List<TestCase>>(
    await File.ReadAllTextAsync(args[0]),
    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
if (tests is null || tests.Count == 0)
{
    Console.Error.WriteLine("The OCR manifest is empty.");
    return 2;
}

NativeOcrService ocr = new();
int failures = 0;
foreach (TestCase test in tests)
{
    string path = Path.Combine(args[1], test.File);
    string text = await ocr.RecognizeFileCropAsync(path, CropFor(test.Layout));
    bool outfitFound = test.Outfit == "Default"
        ? Contains(text, test.Character)
        : Contains(text, test.Outfit);
    bool characterFound = Contains(text, test.Character) ||
                          test.Layout == "customize" && test.Outfit != "Default";
    bool passed = outfitFound && characterFound;
    failures += passed ? 0 : 1;
    Console.WriteLine(JsonSerializer.Serialize(new
    {
        test.File,
        test.Layout,
        test.Character,
        test.Outfit,
        passed,
        ocr = text
    }));
}

Console.WriteLine($"OCR_RESULT passed={tests.Count - failures} total={tests.Count}");
return failures == 0 ? 0 : 1;

static NormalizedCrop CropFor(string layout) => layout switch
{
    "shop" => new(0.02, 0.50, 0.34, 0.20),
    "customize" => new(0.58, 0.32, 0.40, 0.26),
    "battlepass" or "profile" => new(0.56, 0.30, 0.43, 0.28),
    _ => new(0.35, 0.04, 0.30, 0.08)
};

static bool Contains(string actual, string expected)
{
    string haystack = Normalize(actual);
    string needle = Normalize(expected);
    if (haystack.Contains(needle, StringComparison.Ordinal))
    {
        return true;
    }

    string[] words = needle.Split(' ', StringSplitOptions.RemoveEmptyEntries);
    return words.Length > 1 && words.Count(word => haystack.Contains(word, StringComparison.Ordinal)) >= words.Length - 1;
}

static string Normalize(string value) => string.Join(
    ' ',
    new string(value.ToLowerInvariant()
        .Where(character => char.IsLetterOrDigit(character) || char.IsWhiteSpace(character))
        .ToArray())
        .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

internal sealed record TestCase(string File, string Layout, string Character, string Outfit);

