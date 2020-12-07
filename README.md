
# aws-client-file-upload
Upload files from browser (Client Side) in Aws S3 Bucket via signed url. it supports both multipart and single upload

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


# Backend Code (Laravel)
```php
<?php

namespace App\Http\Controllers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestController extends Controller
{
 

    public function successResponse($data, $msg = null)
    {
        return new JsonResponse([
            "success" => true,
            "status_code" => 200,
            "data" => $data,
            "message" => $msg,
        ]);
    }

    function errorResponse($msg = null, $errors = [], $code = 500)
    {
        return new JsonResponse([
            "success" => false,
            "status_code" => $code,
            "errors" => $errors,
            "message" => $msg,
        ]);
    }



    public function upload()
    {
        return $this->successResponse([
            "url" => (string) s3PutObjectSignedRequest(request('fileName'))->getUri()
        ]);
    }


    public function uploadStart (){
        $apiKey =  env('AWS_ACCESS_KEY_ID');
        $secret =  env('AWS_SECRET_ACCESS_KEY');
        $bucket =  env('AWS_BUCKET');
        try {
            $s3 = s3Client($apiKey, $secret);
            $result = $s3->createMultipartUpload([
                'Bucket'       => $bucket,
                'Key'          => request('fileName'),
                'ACL'          => 'public-read',
            ]);
            $uploadId = $result['UploadId'];
            return $this->successResponse([
                "uploadId" => $uploadId
            ]);
        } catch (\Throwable $th) {
            // return $this->errorResponse("failed to initiate upload.");
            return $this->errorResponse($th->getMessage());
        }
    }


    public function signedUrl(){
        $apiKey =  env('AWS_ACCESS_KEY_ID');
        $secret =  env('AWS_SECRET_ACCESS_KEY');
        $bucket =  env('AWS_BUCKET');
        try {
            $s3 = s3Client($apiKey, $secret);
            $cmd = $s3->getCommand('UploadPart', array(
                'Bucket' => $bucket,
                'Key' => request('fileName'),
                'PartNumber' => request('partNumber'),
                'UploadId' => request('uploadId'),
            ));

            $url = $s3->createPresignedRequest($cmd, '+20 minutes')->getUri();
            return $this->successResponse([
                "url" => (string) $url
            ]);
        } catch (\Throwable $th) {
            // return $this->errorResponse("failed to generate signedurl.");
            return $this->errorResponse($th->getMessage());

        }
    }


    public function complete(){
        $apiKey =  env('AWS_ACCESS_KEY_ID');
        $secret =  env('AWS_SECRET_ACCESS_KEY');
        $bucket =  env('AWS_BUCKET');
        $params = [
            'Bucket'       => $bucket,
            'Key'          => request('fileName'),
            'UploadId' => request('uploadId'),
            'MultipartUpload' => [
                'Parts' => request('parts')
            ],
        ];
        try {
            $s3 = s3Client($apiKey, $secret);
            $result = $s3->completeMultipartUpload($params);
            $location =  $result['Location'];
            return $this->successResponse([
                "url" => $location
            ]);
        } catch (\Throwable $th) {
            throw ($th);
            return $this->errorResponse("failed to complete.");
        }
    }
}
?>
```