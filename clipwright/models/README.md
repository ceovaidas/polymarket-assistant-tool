Face models for the people detector (from `@vladmandic/face-api@1.7.15`, MIT).
The `*.bin.txt` weight files are not committed. Recreate them:

    npm pack @vladmandic/face-api@1.7.15 && tar xzf vladmandic-face-api-1.7.15.tgz
    for f in tiny_face_detector_model face_landmark_68_tiny_model face_recognition_model; do
      cp package/model/$f-weights_manifest.json .
      base64 -w0 package/model/$f.bin > $f.bin.txt
    done

Without them the page loads the same models from jsDelivr.
