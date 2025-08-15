import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;


public class Customer {
    private final Connection conn;
    private final Address address;

    // Sets the database connector
    public Customer(Connection conn) {
        this.conn = conn;
        this.address = new Address(conn);
    }

    // Creates a new customer tuple
    public boolean insertCustomer(
            int id,
            String name,
            int point,
            String streetNum,
            String postalcode,
            String unit,
            String country
    ) {

        try {
            conn.setAutoCommit(false);  // start transaction

            // Check if address exists, if not insert it
            if (!address.addressExists(streetNum, postalcode, unit, country)) {
                boolean inserted = address.insertAddress2(streetNum, postalcode, unit, country);
                if (!inserted) {
                    conn.rollback();
                    System.out.println("Failed to insert address.");
                    return false;
                }
            }
            System.out.println("INSERT IS WORKING");

            // Now insert customer referencing the existing address
            String sql = "INSERT INTO Customer (id, name, point, street_num, postalcode, unit, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, id);
                ps.setString(2, name);
                ps.setInt(3, point);
                ps.setString(4, streetNum);
                ps.setString(5, postalcode);
                ps.setString(6, unit);
                ps.setString(7, country);

                int rowsInserted = ps.executeUpdate();
                if (rowsInserted == 1) {
                    conn.commit();
                    return true;
                } else {
                    conn.rollback();
                    System.out.println("Failed to insert customer.");
                    return false;
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
            try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            return false;
    } finally {
            try {
                conn.setAutoCommit(true);
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

}