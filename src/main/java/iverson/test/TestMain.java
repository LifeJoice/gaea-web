package iverson.test;

/**
 * Created by iverson on 2017/9/27.
 */
public class TestMain {
    public static void main(String[] args) {

//        System.out.println(System.currentTimeMillis() - 2937600000L);

        // -------------------------------------------------------------- Test Enum --------------------------------------------------------------
        System.out.println(TestEnum.STATUS_OK);
    }

    enum TestEnum {
        STATUS_OK(200);
        private int status;

        private TestEnum(int status) {
            this.status = status;
        }

        @Override
        public String toString() {
            return String.valueOf(status);
        }
    }
}
