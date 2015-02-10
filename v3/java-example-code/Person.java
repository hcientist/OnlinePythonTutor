// demonstrates static/non-static fields and methods
// simulates a person (not in the Blade Runner sense)
public class Person {
   // instance variable: age of this person
   private int age;                    

   // another instance variable: name of this person
   private String name;                

   // static variable (shared by all instances): global population
   private static int population = 0;
    
   // constructor
   public Person(int a, String n) {
      // copy arguments of constructor to instance variables
      age = a;
      name = n;

      // increase the static counter
      population++;
   }

   // static method (not per-instance)
   public static void printPop() {
      System.out.println(population);
   }

   // instance method
   public void printName() {
      System.out.println(name);
   }

   // another instance method
   public void printInfo() {                 
      System.out.println(age);
 
      // calling an instance method without a period
      // (uses same instance as what printInfo was called on)
      printName();
   }

   public static void main(String[] args) {
      // calling a static method using class name and period
      // what is the output?
      Person.printPop();     
                          
      // how many instances does this construct?
      Person myDad = new Person(33, "Lucius");
      Person myMom = new Person(44, "Pandora");
      Person myDentist = myMom;

      // calling an instance method using instance name and period
      myDentist.printInfo();     
                   
      // calling a static method without a period
      // (uses Person, the containing class, by default)
      // what is the output?
      printPop();
   }
}
