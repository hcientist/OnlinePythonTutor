public class TwoClasses {
    String message = "Can you put two classes in one file?";
    void proclaim() {
        System.out.println(message);
    }
    public static void main(String[] args) {
        new TwoClasses().proclaim();
        new AnotherClass().proclaim();
    }
}
class AnotherClass extends TwoClasses{
    {message = "Yup";} // instance initializer
}
