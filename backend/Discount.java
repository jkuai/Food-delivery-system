import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Date;

public class Discount {
    private final Connection conn;

    public Discount(Connection conn) {
        this.conn = conn;
    }

    // Check that the referenced order exists
    private boolean orderExists(int ordernum) throws SQLException {
        String sql = "SELECT 1 FROM Order_2 WHERE number = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, ordernum);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    // Check if a discount exists by (amountsaved, ordernum)
    public boolean discountExists(int amountsaved, int ordernum) throws SQLException {
        String sql = "SELECT 1 FROM Discount WHERE amountsaved = ? AND ordernum = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, amountsaved);
            ps.setInt(2, ordernum);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }


    public boolean applyDiscount(int amountsaved, int ordernum, java.util.Date expirydate) {
        try {
            conn.setAutoCommit(false);

            if (!orderExists(ordernum)) {
                System.out.println("Order #" + ordernum + " does not exist.");
                conn.rollback();
                return false;
            }
            if (discountExists(amountsaved, ordernum)) {
                System.out.println("Discount already exists for order #" + ordernum);
                conn.rollback();
                return false;
            }

            String sql = "INSERT INTO Discount (amountsaved, ordernum, expirydate) VALUES (?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, amountsaved);
                ps.setInt(2, ordernum);
                ps.setDate(3, new Date(expirydate.getTime()));
                int rowsInserted = ps.executeUpdate();
                if (rowsInserted == 1) {
                    conn.commit();
                    return true;
                } else {
                    System.out.println("Failed to insert discount.");
                    conn.rollback();
                    return false;
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
            try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            return false;
        } finally {
            try { conn.setAutoCommit(true); } catch (SQLException e) { e.printStackTrace(); }
        }
    }
}
