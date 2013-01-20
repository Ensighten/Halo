[{
// Annoying low level test
  "A BaseController": {
    "can be created": true,
    "when started": {
      "calls `start`": true
    },
    "when stopped": {
      "calls `stop`": true
    }
  }
}, {
// Less-annoying low level test
  "An HtmlController": {
    "when started": {
      "appends content to the container": true,
      "when stopped": {
        "removes content from the container": true
      }
    }
  }
}, {
  "A CrudModel": {
    "can be created": true,
    "can be created with a memory mixin": true
  }
}, {
// Don't test SocketModel further due to intended deprecation
// TODO: Replacement will be XHR-polling + HTTP METHOD calls
  "A SocketModel": {
    "can be created": true,
    "has this.socket": true
  }
}, {
  "mvc": {
// TODO: Coming soon
    "can resolve models": true,
// TODO: Coming soon
    "can resolve controllers": true,
// This is the one we care about first
    "can resolve view": true
  }
}]