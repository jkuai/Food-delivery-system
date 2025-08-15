import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

public class OrderItem {
    private final Connection conn;

    public OrderItem(Connection conn) {
        this.conn = conn;
    }

    // Add an item (with quantity) to an existing order
    public boolean addItemToOrder(int ordernum, int itemid, int quantity) throws SQLException {
        String sql = "INSERT INTO Order_Item (ordernum, itemid, quantity) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, ordernum);
            ps.setInt(2, itemid);
            ps.setInt(3, quantity);
            return ps.executeUpdate() == 1;
        }
    }

    // List all items (with quantity) for a given order number
    public List<Map<String,Object>> listItemsByOrder(int ordernum) throws SQLException {
        String sql =
                "SELECT i.itemid AS itemid, i.name AS name, i.price AS price, oi.quantity AS quantity " +
                        "FROM Order_Item oi " +
                        "JOIN Item i ON oi.itemid = i.itemid " +
                        "WHERE oi.ordernum = ?";
        List<Map<String,Object>> items = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, ordernum);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String,Object> row = new HashMap<>();
                    row.put("itemid",   rs.getInt("itemid"));
                    row.put("name",     rs.getString("name"));
                    row.put("price",    rs.getInt("price"));
                    row.put("quantity", rs.getInt("quantity"));
                    items.add(row);
                }
            }
        }
        return items;
    }
}
