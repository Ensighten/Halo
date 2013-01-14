[{
// Annoying low level test
  "A BaseController": {
    "can be created": true,
    "that has been defined": {
      "that is started": {
        "has started": true,
        "and that is stopped": {
          "has stopped": true
        }
      }
    }
  }
}, {
// Less-annoying low level test
  "An HtmlController": {
    "that is started via Sauron": {
      "appends content to the container": true,
      "and then stopped": {
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
  "CrudModel#retrieve": {
    "works as expected": true
  }
}, {
  "CrudModel#create": {
    "works as expected": true
  }
}, {
  "CrudModel#update": {
    "works as expected": true
  }
}, {
  "CrudModel#delete": {
    "works as expected": true
  }
}, {
// TODO: Don't test SocketModel further due to intended deprecation
  "A SocketModel": {
    "can be created": true,
    "can be created with a memory mixin": true
  }
}
// TODO: Test collision for stop of HtmlControllers
]