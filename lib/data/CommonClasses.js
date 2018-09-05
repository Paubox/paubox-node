'use strict';

var t = require('tcomb');

//#region  Classes for Get Email Disposition method


var MessageStatus = t.struct({
    deliveryStatus: t.maybe(t.Str),
    deliveryTime: t.maybe(t.Str),
    openedStatus: t.maybe(t.Str),
    openedTime: t.maybe(t.Str)
}, {
    defaultProps: {
        deliveryStatus: null,
        deliveryTime: null,
        openedStatus: null,
        openedTime: null
    }
});

var MessageDeliveries = t.struct({
    recipient: t.Str,
    status: t.maybe(MessageStatus)
}, {
    defaultProps: {
        recipient: null,
        status: null
    }
});

var MessageDetails = t.struct({
    id: t.Str,
    message_deliveries: t.maybe(t.list(MessageDeliveries))
}, {
    defaultProps: {
        id: null,
        message_deliveries: null
    }
});

var MessageData = t.struct({
    message: t.maybe(MessageDetails)
}, {
    defaultProps: {
        message: null
    }
});

var Error = t.struct({
    code: t.Num,
    title: t.Str,
    details: t.Str
});

var GetEmailDispositionResponse = t.struct({

    sourceTrackingId: t.maybe(t.Str),
    data: t.maybe(MessageData),
    errors: t.maybe(t.list(Error))
}, {
    defaultProps: {
        sourceTrackingId: null,
        data: null,
        errors: null
    }
});

module.exports = function (options) {
    return new GetEmailDispositionResponse(options);
};

//#endregion  Classes for Get Email Disposition method

//#region Common Classes

//#endregion Common Classes