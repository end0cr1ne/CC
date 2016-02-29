var Controller = function(config) {
    var cm = CodeMirror(document.getElementById(config.selector), {
        value: config.default,
        mode: config.mode,
        lineNumbers: true,
        theme: 'material',
        extraKeys: {
            'Alt': 'autocomplete'
        }
    });
    var ca = new ot.CodeMirrorAdapter(cm);
    var CA = ot.CodeMirrorAdapter;
    cm.on('changes', onUserChange);
    cm.on('cursorActivity', onUserSelectionChange)
    console.log(ot);

    var socket = io('http://localhost:3000/');
    socket.on('conn', function (data) {
        console.log('Init: ', data);
        cm.swapDoc(CodeMirror.Doc(data.doc, 'javascript'));
        client.revision = data.revision;
    });

    socket.on('change', function (data) {
        onReceiveOperation(data);
    });
    socket.on('cursor', function (data) {
        onReceiveSelection(data);
    });
    socket.on('ack', function (data) {
        console.log('client: ack');
        client.serverAck();
    });

    var client = new ot.Client(0);
    var dontSend = false, dontSendSelection = false;

    client.applyOperation = function (operation) {
        console.log('apply OP');
        ca.applyOperation(operation);
    };
    client.sendOperation = function (revision, operation) {
        if (!dontSend) {
            console.log('send OP: ', operation.toJSON());
            socket.emit('change', revision, operation);
        } else dontSend = false;
    };

    function onUserChange(o, change) {
        var operation = CA.operationFromCodeMirrorChanges(change, cm);
        client.applyClient(operation[0]);
    }

    function onUserSelectionChange() {
        if (!dontSendSelection) {
            var selection = ca.getSelection();
            socket.emit('cursor', selection);
        } else dontSendSelection = false;
    }

    function onReceiveSelection(json) {
        var selection = ot.Selection.fromJSON(json.selection);
        dontSendSelection = true;
        selection = client.transformSelection(selection);
        ca.setOtherSelection(selection, '#FFFFFF', json.id);
    }

    function onReceiveOperation(json) {
        var operation = ot.TextOperation.fromJSON(json);
        dontSend = true;
        client.applyServer(operation);
    }
};
