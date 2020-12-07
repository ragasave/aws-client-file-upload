/**
 * To upload file on aws s3
 * @link   www.ragasave.com
 * @file   index.js
 * @author Rahul Varma
 * @since  07.12.2020
 */


const Errors = {
    0 : `Invalid option parameter it must be an Object`,
    1 : `Invalid File`,
    2 : `Invalid Response format, response format must be 
        {
            success : true|false,
            data : {
                url : String
            }
        }
    `,
    3 : `sined Url not found in response`,
    4 : `MultipartUpload: upload id not found in response`,
    5 : `Failed to upload file`,
    6 : `MultipartUpload: uploadIdRequest not provided.`,
    7 : `MultipartUpload: uploadIdRequest url not provided.`,
    8 : `MultipartUpload: upload id not found in response`,
    9 : `File name is not provided.`,
    10 : `MultipartUpload: failed to complete file upload.`,
    11 : `MultipartUpload: The minimal multipart upload size is 5Mb (chunkSize >= 5MB).`,
    12 : `MultipartUpload: multipartsignedUrlRequest.url -> Url is missing`
};




class _AwsFileUpload {
    constructor(options) {
        this.options = options;
        this.isUploadModeMultipart = false;
        this.init()
            .catch((errors) => {
                var message, response, code
                if (errors.code && Errors[errors.code]) {
                    message = Errors[errors.code];
                    code = errors.code;
                    response = errors.response || null
                } else {
                    message = errors;
                    code = null;
                    response = null
                }
                if (this.options.onError) {
                    this.options.onError({
                        message: Errors[errors.code],
                        response: errors.response,
                        code: errors.code,
                    })
                } else {
                    console.group("AwsFileUpload");
                    console.error(errors.code ? Errors[errors.code] : errors);
                    console.error(`errorCode: ${code}`);
                    console.groupEnd();
                }
            });
    }

    fetchSignedUrl() {

        var requestOptions, url, body; 
        requestOptions = this.isUploadModeMultipart &&  this.options.multipartsignedUrlRequest ? Object.assign({}, this.options.multipartsignedUrlRequest) : Object.assign({}, this.options.signedUrlRequest);
        url = requestOptions.url;
        body = requestOptions.body || {}; 
        if (this.isUploadModeMultipart) {
            body.partNumber = this.partNumber;
            body.uploadId = this.uploadId;
        }
        body.fileName = this.options.fileName;
        requestOptions.body = JSON.stringify(body);
        delete requestOptions.url;
        return fetch(url, requestOptions);
    }
    
    fetchUploadId(){
        var requestOptions = Object.assign({}, this.options.uploadIdRequest);
        let body = requestOptions.body || {}; 
        body.fileName = this.options.fileName;
        requestOptions.body = JSON.stringify(body);
        delete requestOptions.url;
        return fetch(this.options.uploadIdRequest.url, requestOptions);
    }
    
    completeMultipart(uploadPartsArray){
        var requestOptions = Object.assign({}, this.options.completeMultipartRequest);
        let body = requestOptions.body || {}; 
        body.fileName = this.options.fileName;
        body.uploadId = this.uploadId;
        body.parts = uploadPartsArray;
        requestOptions.body = JSON.stringify(body);
        delete requestOptions.url;
        return fetch(this.options.completeMultipartRequest.url, requestOptions);
    }

    async init() {
        var response, data, body;
        if (!(this.options instanceof Object)) throw { code: 0 }
        if (!(this.options.file instanceof File)) throw { code: 1 };
        if (!this.options.fileName) throw { code: 9 };
        if (!this.options.signedUrlRequest.headers) this.options.signedUrlRequest.headers = {};
        if (!this.options.signedUrlRequest.headers['Content-type']) this.options.signedUrlRequest.headers['Content-type'] = "application/json";
        this.evaluateIsMultipart();



        if (this.isUploadModeMultipart) {
            if(!this.options.uploadIdRequest) throw {code : 6}
            if (!this.options.uploadIdRequest.url) throw { code: 7 };
            if (!this.options.uploadIdRequest.headers) this.options.uploadIdRequest.headers = {};
            if (!this.options.uploadIdRequest.headers['Content-type']) this.options.uploadIdRequest.headers['Content-type'] = "application/json";
            
            if(this.options.multipartsignedUrlRequest){
                if(!this.options.multipartsignedUrlRequest.url) throw { code: 12 };
                if (!this.options.multipartsignedUrlRequest.headers) this.options.multipartsignedUrlRequest.headers = {};
                if (!this.options.multipartsignedUrlRequest.headers['Content-type']) this.options.multipartsignedUrlRequest.headers['Content-type'] = "application/json";
            } 

            if(!this.options.completeMultipartRequest) throw {code : 6}
            if (!this.options.completeMultipartRequest.url) throw { code: 7 };
            if (!this.options.completeMultipartRequest.headers) this.options.completeMultipartRequest.headers = {};
            if (!this.options.completeMultipartRequest.headers['Content-type']) this.options.completeMultipartRequest.headers['Content-type'] = "application/json";

            let numOfChunks = Math.floor(this.options.file.size / this.options.chunkSize) + 1;
            let responseArray = [];
            let uploadPartsArray = [];
            let start, end, blob;

            response = await this.fetchUploadId()
            if (response.status != 200) throw { code: 8, response: response };
            data = await response.json();
            this.uploadId = data.data.uploadId;
            //  chunk upload
            if (!this.uploadId) throw { code: 4 };
            for (let index = 1; index < numOfChunks + 1; index++) {
                start = (index - 1) * this.options.chunkSize;
                end = index * this.options.chunkSize;
                blob = index < numOfChunks ? this.options.file.slice(start, end) : this.options.file.slice(start);
                this.partNumber = index;
                response = await this.fetchSignedUrl();
                body = await response.json();
                if (!body.data) throw { code: 2, response: response };
                if (!body.data.url) throw { code: 3, response: response };
                this.signedUrl = body.data.url;
                response = await this.uploadFile(blob);
                if (response.status != 200) throw { code: 5, response: response };
                responseArray.push(response);
                uploadPartsArray.push({
                    // ETag: response.headers.get("etag").replaceAll('"', ""),
                    ETag: response.headers.get("etag"),
                    PartNumber: index,
                    Size: blob.size
                });
            }
            response = await this.completeMultipart(uploadPartsArray);
            if (response.status != 200) throw { code: 10, response: response };
            if (this.options.onSuccess) this.options.onSuccess(response, uploadPartsArray, responseArray)
        } else {
            response = await this.fetchSignedUrl();
            body = await response.json();
            if (!body.data) throw { code: 2, response: response };
            if (!body.data.url) throw { code: 3, response: response };
            this.signedUrl = body.data.url;
            response = await this.uploadFile(this.options.file);
            if (response.status != 200) throw { code: 5, response: response }
            if (this.options.onSuccess) this.options.onSuccess(response)
        }

    }


    uploadFile(file) {
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", this.options.file.type);
        var requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: file,
            redirect: "follow",
        };
        return fetch(this.signedUrl, requestOptions)
    }
    

    evaluateIsMultipart(){
        if(this.options.multipartUpload == 'auto' || this.options.multipartUpload == true){
            if (this.options.chunkSize && this.options.chunkSize < 6000000) throw { code: 11 };
            this.options.chunkSize = this.options.chunkSize || 10000000; // 10MB
            this.isUploadModeMultipart = this.options.multipartUpload == 'auto' ? (this.options.file.size/this.options.chunkSize) > 1 : true;
        }
    }
    
}




async function getFileFromUrl(url, name, defaultType = 'image/jpeg') {
    const response = await fetch(url);
    const data = await response.blob();
    return new File([data], name, {
        type: response.headers.get('content-type') || defaultType,
    });
}

// AwsFileUpload.File = async () => { return await getFileFromUrl('https://dummyimage.com/vga', 'example.jpg') };


export default function AwsFileUpload(options) {
    new _AwsFileUpload(options);
}