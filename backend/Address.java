import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class Address {
    private final Connection conn;

    public Address(Connection conn) {
        this.conn = conn;
    }

    // Insert into Address_1 (with province and city)
    public boolean insertAddress1(String country, String postalcode, String province, String city) {
        System.out.println("insertAddress1 called with country=" + country + ", postalcode=" + postalcode + ", province=" + province + ", city=" + city);


        String sql = "INSERT INTO Address_1 (country, postalcode, province, city) VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, country);
            ps.setString(2, postalcode);
            ps.setString(3, province);
            ps.setString(4, city);
            int rowsInserted = ps.executeUpdate();
            return rowsInserted == 1;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // Insert into Address_2 (with street#, postalcode, unit, country)
    public boolean insertAddress2(String streetNum, String postalcode, String unit, String country) {
        System.out.println("insertAddress2 called with streetNum=" + streetNum + ", postalcode=" + postalcode + ", unit=" + unit + ", country=" + country);


        String sql = "INSERT INTO Address_2 (street_num, postalcode, unit, country) VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, streetNum);
            ps.setString(2, postalcode);
            ps.setString(3, unit);
            ps.setString(4, country);
            int rowsInserted = ps.executeUpdate();
            return rowsInserted == 1;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // Check if an address exists in the table
    public boolean addressExists(String streetNum, String postalcode, String unit, String country) throws SQLException {
        System.out.println("addressExists called");

        String sql = "SELECT 1 FROM Address_2 WHERE street_num = ? AND postalcode = ? AND unit = ? AND country = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, streetNum);
            ps.setString(2, postalcode);
            ps.setString(3, unit);
            ps.setString(4, country);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();  // true if at least one record found
            }
        }
    }

    public boolean address1Exists(String country, String postalcode) throws SQLException {
        String sql = "SELECT 1 FROM Address_1 WHERE country = ? AND postalcode = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, country);
            ps.setString(2, postalcode);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

}
