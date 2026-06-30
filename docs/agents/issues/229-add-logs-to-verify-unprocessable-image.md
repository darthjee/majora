# Issue: Add logs to verify unprocessable image

## Problem
In the proxy, image uploads are validated in `proxy/extension/PhotoUploadHandler.php` (`isValidImage`, around line 153), which checks both the MIME type and file extension before accepting an upload.

A request was observed failing with `422 Unprocessable Entity` even though the uploaded file (`dragon_heist.jpg`, `Content-Type: image/jpeg`) appears to be a valid, supported image type. There is currently no logging and no detail in the response to explain why a given upload was rejected, making it impossible to diagnose why this particular request failed validation.

<details>
<summary>Request Data</summary>

```
PATCH /uploads/2/submit HTTP/2
Host: moria.ffavs.net
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0
Accept: */*
Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7
Accept-Encoding: gzip, deflate, br, zstd
Referer: https://moria.ffavs.net/
X-Upload-Token: [REMOVED FOR SAFETY]
X-Skip-Cache: true
Content-Type: multipart/form-data; boundary=----geckoformboundary72f0bbbae4cb6ba9d836f9381d3dea5d
Content-Length: 9081
Origin: https://moria.ffavs.net
Connection: keep-alive
Cookie: sessionid=[REMOVED FOR SAFETY]
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
Priority: u=4
```

</details>

<details>
<summary>Beginning of Request information</summary>

```
------geckoformboundary72f0bbbae4cb6ba9d836f9381d3dea5d
Content-Disposition: form-data; name="file"; filename="dragon_heist.jpg"
Content-Type: image/jpeg
```

</details>

## Expected Behavior
When an upload is rejected by `isValidImage`, the specific reason should be identifiable from both the server logs and the HTTP response, without needing to reproduce the request:

- The validation logic should distinguish *why* the file was rejected: no file present, unsupported MIME type, or unsupported extension (mime/extension are still checked independently, so either one can be the actual cause).
- A `Tent\Log\Logger::warn()` call (the logging facade already used elsewhere in Tent, via `Tent\Log\Logger`) should record the rejection reason together with the received file name and MIME type.
- The `422` response body should become structured JSON carrying the same detail, e.g.:

```json
{
  "error": "Unprocessable Entity",
  "reason": "unsupported_mime_type",
  "filename": "doc.pdf",
  "mimeType": "application/pdf"
}
```

  with `reason` being one of `missing_file`, `unsupported_mime_type`, `unsupported_extension`.

## Solution
Refactor `isValidImage` (or its caller) to determine and surface the specific rejection reason instead of a plain boolean, then:

1. Log the rejection via `Tent\Log\Logger::warn()`, including the reason, file name, and MIME type.
2. Return a `422` response with a structured JSON body containing the same information (see Expected Behavior), replacing the current plain-text `Unprocessable Entity` body.

Existing tests asserting on the `422` response body/shape will need updating to match the new structured format.

---

Tags: :shipit:
