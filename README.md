
# aws-client-file-upload
Upload files from browser (Client Side) in Aws S3 Bucket via signed url. it supports both multipart and single upload

## CDN
```
https://cdn.jsdelivr.net/gh/ragasave/aws-client-file-upload@v1/dist/bundle.js
```

## Get Start
This library provides an simple and single method to upload file on your aws s3 bucket from your browser or client side. it uses `signed url` to upload file.
To upload file you just have to use `AwsFileUpload` method.


**Syntax:**
```js
new AwsFileUpload(options) //options = {}
```

### Available Options

 - `fileName`:String|required,
	 - `signedUrlRequest` : Object
		 - `url`: String|required
		 - `method`: String|Optional
		 - `headers`: Object|Optional,
	 - `multipartsignedUrlRequest` : Object
		 - `url`: String|required
		 - `method`: String|Optional
		 - `headers`: Object|Optional,
	 - `uploadIdRequest` : Object
		 - `url`: String|required
		 - `method`: String|Optional
		 - `headers`: Object|Optional,
	 - `completeMultipartRequest` : Object
		 - `url`: String|required
		 - `method`: String|Optional
		 - `headers`: Object|Optional,
	- `chunkSize`: `Integer|Optional`
	- `file`: file
	- `multipartUpload`:  `'auto'|true|false`
	- `onSuccess`:`callback(response,  ?uploadPartsArray,  ?responseArray)`
	- `onError`:`callback(error, ?response)`	


> **Node**: As per aws s3 documentation minimum chunk size is 5MB

### Backend Response Format
#### `signedUrlRequest, multipartsignedUrlRequest, completeMultipartRequest`
```json
{
	"success" : "Boolean",
	"data" : {
		"url" : "String",	
	},
	"message" : "String"
}
```

#### `uploadIdRequest`
```json
{
	"success" : "Boolean",
	"data" : {
		"uploadId" : "String",	
	},
	"message" : "String"
}
```


## Example code (Upload in single request)



```js
      var file = fileElem.files[0];
      var upload = new AwsFileUpload({
        fileName: file.name,
        signedUrlRequest: {
          url: url,
          method: "POST",
        },
        file: file,
        onSuccess: function (response) {
          alert('file uploaded.');
        },
        onError: function(error, response){
          alert(error.message)
        }
      })
    }
```


## Example code (Multipart upload)

```js
      var file = fileElem.files[0];
      var upload = new AwsFileUpload({
        fileName: file.name,
        multipartsignedUrlRequest: {
          url: 'http://unity-of-hindu.com/api/multipart/signedurl',
          method: "POST",
        },
        uploadIdRequest: {
          url: 'http://unity-of-hindu.com/api/multipart/start',
          method: "POST",
        },
        completeMultipartRequest: {
          method: "POST",
          url: 'http://unity-of-hindu.com/api/multipart/complete'
        },
        chunkSize: 6000000,
        file: file,
        multipartUpload: true,
        onSuccess: function (response,  uploadPartsArray,  responseArray) {
          alert('file uploaded.');
        },
        onError: function(error){
          alert(error.message)
        }
      })
    }
```

## Example code (Auto Decide Multipart or Single upload)

```js
      var file = fileElem.files[0];
      var upload = new AwsFileUpload({
        fileName: file.name,
        signedUrlRequest: {
          url: url,
          method: "POST",
        },
        multipartsignedUrlRequest: {
          url: 'http://unity-of-hindu.com/api/multipart/signedurl',
          method: "POST",
        },
        uploadIdRequest: {
          url: 'http://unity-of-hindu.com/api/multipart/start',
          method: "POST",
        },
        completeMultipartRequest: {
          method: "POST",
          url: 'http://unity-of-hindu.com/api/multipart/complete'
        },
        chunkSize: 6000000,
        file: file,
        multipartUpload: 'auto',
        onSuccess: function (response,  uploadPartsArray,  responseArray) {
          alert('file uploaded.');
        },
        onError: function(error){
          alert(error.message)
        }
      })
    }
```
