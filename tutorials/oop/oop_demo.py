class A:
  x = 1
  y = 'hello'
  
#inner class
class B:
  z = 'bye'

class C(A,B):
  def salutation(self):
    return '%d %s %s' % (self.x, self.y, self.z)
 

inst = C()
print inst.salutation()#output-  1 hello bye
inst.x = 100 #here we update the value of x
print inst.salutation()#output -- 100 hello bye





