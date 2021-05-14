$globalX = 'I am a global!'
$globalY = 'I am another global!'

localX = 'I am a local in <main>'

def foo
  reallyLocalX = 'I am a local in foo'
  puts reallyLocalX
  $globalX << $globalY
end

$globalX << '---'
foo
