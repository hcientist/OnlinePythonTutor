# Adapted from Learning Ruby by Michael Fitzgerald, O'Reilly

name = "Matz"
name = name.to_sym
name2 = :Matz.id2name
puts name
puts name2

x = :"Matz with spaces and !?!"
x2 = :"Matz with spaces and !?!"
puts x.object_id == x2.object_id
