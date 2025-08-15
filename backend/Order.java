import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Order {
    private final Connection conn;

    public Order(Connection conn) {
        this.conn = conn;
    }

    // Insert into Order_1 (subtotal, amountsaved, total)
    public boolean insertOrder1(int subtotal, int amountsaved, int total) {
        String sql = "INSERT INTO Order_1 (subtotal, amountsaved, total) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, subtotal);
            ps.setInt(2, amountsaved);
            ps.setInt(3, total);
            int rowsInserted = ps.executeUpdate();
            return rowsInserted == 1;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // Insert into Order_2 (number, subtotal, amountsaved, custid, restid, driveid,
    //                     cardnum, custstreet, custpost, custunit, custcountry,
    //                     reststreet, restpost, restunit, restcountry)
    public boolean insertOrder2(int number,
                                int subtotal,
                                int amountsaved,
                                int custid,
                                int restid,
                                int driveid,
                                String cardnumber) {
        String sql = "INSERT INTO Order_2 (" +
                "order_number, subtotal, amountsaved, custid, restid, driveid, " +
                "cardnumber") VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, number);
            ps.setInt(2, subtotal);
            ps.setInt(3, amountsaved);
            ps.setInt(4, custid);
            ps.setInt(5, restid);
            ps.setInt(6, driveid);
            ps.setString(7, cardnumber);
            int rowsInserted = ps.executeUpdate();
            return rowsInserted == 1;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // Check if a order exists in Order_1 by (subtotal, amountsaved)
    public boolean order1Exists(int subtotal, int amountsaved) throws SQLException {
        String sql = "SELECT 1 FROM Order_1 WHERE subtotal = ? AND amountsaved = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, subtotal);
            ps.setInt(2, amountsaved);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();  // true if at least one record found
            }
        }
    }

    // Check if an order exists in Order_2 by number (primary key)
    public boolean order2Exists(int number) throws SQLException {
        String sql = "SELECT 1 FROM Order_2 WHERE number = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, number);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next(); // true if at least one record found
            }
        }
    }


    public boolean createOrder(int number,
                               int subtotal,
                               int amountsaved,
                               int total,
                               int custid,
                               int restid,
                               int driveid,
                               String cardnumber) {
        try {
            conn.setAutoCommit(false);

            // Insert into Order_1 if not already present
            if (!order1Exists(subtotal, amountsaved)) {
                if (!insertOrder1(subtotal, amountsaved, total)) {
                    System.out.println("Failed to insert into Order_1.");
                    conn.rollback();
                    return false;
                }
            }

            // Prevent duplicate order numbers in Order_2
            if (order2Exists(order_number)) {
                System.out.println("Order number " + order_number + " already exists.");
                conn.rollback();
                return false;
            }

            // Insert into Order_2
            if (!insertOrder2(number, subtotal, amountsaved, custid, restid, driveid,
                    cardnumber)) {
                System.out.println("Failed to insert into Order_2.");
                conn.rollback();
                return false;
            }

            conn.commit();
            return true;

        } catch (SQLException e) {
            e.printStackTrace();
            try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            return false;
        } finally {
            try { conn.setAutoCommit(true); } catch (SQLException e) { e.printStackTrace(); }
        }
    }

    // List all orders for a given customer id, display the corresponding order number, subtotal, amountsaved, and total.

    public List<Map<String,Object>> listOrdersByCustomer(int custid) throws SQLException {
        String sql = "SELECT o2.order_number AS number, "
                + "o1.subtotal AS subtotal, "
                + "o1.amountsaved AS amountSaved, "
                + "o1.total AS total "
                + "FROM Order_2 o2 "
                + "JOIN Order_1 o1 "
                + "  ON o2.subtotal = o1.subtotal "
                + " AND o2.amountsaved = o1.amountsaved "
                + "WHERE o2.custid = ?";
        List<Map<String,Object>> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, custid);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String,Object> row = new HashMap<>();
                    row.put("order_number",    rs.getInt("order_number"));
                    row.put("subtotal",  rs.getInt("subtotal"));
                    row.put("amountSaved", rs.getInt("amountSaved"));
                    row.put("total",     rs.getInt("total"));
                    list.add(row);
                }
            }
        }
        return list;
    }


    // List all restaurants that a given customer has ordered from
    public List<Map<String,Object>> listRestaurantsByCustomer(int custid) throws SQLException {
        String sql =
                "SELECT DISTINCT r.restid AS restid, r.name AS name " +
                        "FROM Order_2 o " +
                        "JOIN Restaurant r ON o.restid = r.restid " +
                        "WHERE o.custid = ?";
        List<Map<String,Object>> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, custid);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String,Object> row = new HashMap<>();
                    row.put("restid", rs.getInt("restid"));
                    row.put("name",   rs.getString("name"));
                    list.add(row);
                }
            }
        }
        return list;
    }





    //List all information for a single order
    public Map<String,Object> getOrderDetails(int number) throws SQLException {
        String sql =
                "SELECT " +
                        "  o2.order_number AS order_number, " +
                        "  o2.subtotal    AS subtotal, " +
                        "  o2.amountsaved AS amountSaved, " +
                        "  o1.total       AS total, " +
                        "  o2.custid      AS custid, " +
                        "  o2.restid      AS restid, " +
                        "  o2.driveid     AS driveid, " +
                        "  o2.cardnumber  AS cardnum, " +
                        "FROM Order_2 o2 " +
                        "JOIN Order_1 o1 " +
                        "  ON o2.subtotal    = o1.subtotal " +
                        " AND o2.amountsaved = o1.amountsaved " +
                        "WHERE o2.number = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, number);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                Map<String,Object> details = new HashMap<>();
                details.put("order_number",      rs.getInt("order_number"));
                details.put("subtotal",    rs.getInt("subtotal"));
                details.put("amountSaved", rs.getInt("amountSaved"));
                details.put("total",       rs.getInt("total"));
                details.put("custid",      rs.getInt("custid"));
                details.put("restid",      rs.getInt("restid"));
                details.put("driveid",     rs.getInt("driveid"));
                details.put("cardnumber",     rs.getString("cardnumber"));
                return details;
            }
        }
    }


}
