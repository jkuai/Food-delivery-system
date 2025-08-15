import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Date;

public class Payment {
    private final Connection conn;

    // Sets the database connector
    public Payment(Connection conn) {
        this.conn = conn;
    }
    // Add a payment to the database
    public boolean addPayment(String cardnumber, java.util.Date expireDate, String cvv, int custid) {
        String sql = "INSERT INTO Payment (cardnumber, expireddate, CVV, custid) VALUES (?, ?, ?, ?)";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, cardnumber);
            ps.setDate(2, new Date(expireDate.getTime())); // convert java.util.Date to java.sql.Date
            ps.setString(3, cvv);
            ps.setInt(4, custid);

            int rows = ps.executeUpdate();
            return rows > 0;

        } catch (SQLException e) {
            e.printStackTrace(); // You can log this to frontend or logger instead
            return false;
        }
    }

    // Check if a payment with this card number already exists
    public boolean paymentExists(String cardnumber) throws SQLException {
        String sql = "SELECT 1 FROM Payment WHERE cardnumber = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, cardnumber);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();  // true if at least one record found
            }
        }
    }

    // Update an existing payment
    public boolean updatePayment(String cardnumber, java.util.Date expireDate, String cvv, int custid) {
        String sql = "UPDATE Payment SET expireddate = ?, CVV = ?, custid = ? WHERE cardnumber = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, new java.sql.Date(expireDate.getTime()));
            ps.setString(2, cvv);
            ps.setInt(3, custid);
            ps.setString(4, cardnumber);

            int rows = ps.executeUpdate();
            return rows > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

}