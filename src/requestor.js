"use strict";
const axios = require("axios");
// const qs = require("qs");

class Requestor {
  constructor(opts) {
    this.url = opts.url;
    this.headers = {
      authorization: `Token token=${opts.apiKey}`,
      "Content-type": "application/json"
    };
    this.body = opts.body;
  }

  post() {
    const options = {
      url: this.url,
      headers: this.headers,
      data: this.body
    };

    function success(response) {
      console.log(response);
    }

    axios
      .post(this.url, options)
      .then(function() {
        console.log("success");
      })
      .catch(function() {
        console.log("success");
      });
  }

  get(sourceTrackingId) {
    
  //    var axiosInstance = axios.create({
  //     baseURL: this.url,
  //     headers: this.headers,
  //   });

  //   var wholeUrl = this.url +"/message_receipt?sourceTrackingId=" + sourceTrackingId;

  // return axiosInstance({ method:"GET", url:wholeUrl, data:null, headers : axiosInstance.headers})
  // then(response => {
  //     console.log(response);
  //     return response.data;
  // })
  //  .catch(error => {
  //      console.log(error);
  //      return error;
  //  });

  const options = {
    url: this.url +"/message_receipt?sourceTrackingId=" + sourceTrackingId,
    headers: this.headers,
    data: this.body
  };

       var axiosInstance = axios.create({
      baseURL: this.url,
      headers: this.headers,
    });
 
  return axiosInstance({ method:"GET", url:options.url, data:null, headers : options.headers})
  .then(response => {
      //var resp = JSON.parse(response.data);
      var resp = response.data;
      // var result = t.validate(resp, getEmailDispostionResponse);  
      // if (result.isValid()) {
        var jsonResp = JSON.stringify(resp);
        var output = JSON.parse(jsonResp);
        return output;
      //}     
  })
   .catch(error => {
       console.log(error);
       return error;
   });     

  }
}

module.exports = function(options) {
  return new Requestor(options);
};
