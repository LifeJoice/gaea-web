package iverson.test;

import java.io.Serializable;

/**
 *
 * @author Iverson
 */
public class Person implements Serializable {

    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

}
