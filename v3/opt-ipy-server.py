# Adapted from https://github.com/facebook/tornado/tree/master/demos/websocket

import logging
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import os.path

from tornado.options import define, options

import json


define("port", default=8888, help="run on the given port", type=int)


class Application(tornado.web.Application):
    # singleton
    current_full_trace = None

    def __init__(self):
        handlers = [
            (r"/js/(.*)",
             tornado.web.StaticFileHandler,
             {"path": os.path.join(os.path.dirname(__file__), 'js/')}),
            (r"/css/(.*)",
             tornado.web.StaticFileHandler,
             {"path": os.path.join(os.path.dirname(__file__), 'css/')}),
            (r"/", MainHandler),
            (r"/chatsocket", ChatSocketHandler),
            # respond to HTTP POST requests:
            (r"/wholetrace", WholeTraceHandler),
            (r"/difftrace", DiffTraceHandler),
            (r"/clear", ClearHandler),
        ]
        tornado.web.Application.__init__(self, handlers)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("opt-ipy.html")


class WholeTraceHandler(tornado.web.RequestHandler):
    def post(self):
        message = self.request.body
        dat = json.loads(message.decode())
        Application.current_full_trace = dat

        js_msg=dict(payload=Application.current_full_trace, type='wholetrace')
        ChatSocketHandler.send_updates(json.dumps(js_msg))


class DiffTraceHandler(tornado.web.RequestHandler):
    def post(self):
        # TODO: implement me using, say,
        # https://code.google.com/p/google-diff-match-patch/
        pass


class ClearHandler(tornado.web.RequestHandler):
    def post(self):
        Application.current_full_trace = None
        js_msg=dict(type='clear')
        ChatSocketHandler.send_updates(json.dumps(js_msg))


class ChatSocketHandler(tornado.websocket.WebSocketHandler):
    waiters = set()

    def allow_draft76(self):
        # for iOS 5.0 Safari
        return True

    def open(self):
        ChatSocketHandler.waiters.add(self)
        # when a new connection is made, send the entire trace to only
        # THIS browser
        if Application.current_full_trace:
            js_msg=dict(payload=Application.current_full_trace, type='wholetrace')
            self.write_message(json.dumps(js_msg))

    def on_close(self):
        ChatSocketHandler.waiters.remove(self)

    @classmethod
    def send_updates(cls, chat):
        #logging.info("sending message to %d waiters", len(cls.waiters))
        for waiter in cls.waiters:
            try:
                waiter.write_message(chat)
            except:
                logging.error("Error sending message", exc_info=True)


def main():
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
