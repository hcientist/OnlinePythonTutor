class Metaclass(type):
    def __new__(mcs, name, bases, dict_):
        print("__NEW__")
        cls = super(Metaclass, mcs).__new__(mcs, name, bases, dict_)
        return cls

    def __init__(cls, name, bases, dict_):
        print("__INIT__")
        super(Metaclass, cls).__init__(name, bases, dict_)

    def __call__(cls, *args):
        print("__CALL__")
        obj = super(Metaclass, cls).__call__(*args)
        return obj

class MyObj(object):
    __metaclass__ = Metaclass

MyObj()
