"use strict";

class Post {
    constructor(id,title) {  
        this.id =     id;
        this.title =  title;          
    }
}

class Comment {
    constructor(id,text,postId) {            
        this.id =     id;
        this.text =   text;
        this.postId = postId;
    }
}


class Payload {
    constructor(posts,comments) {            
        this.posts =    posts;
        this.comments = comments;
    }
}

