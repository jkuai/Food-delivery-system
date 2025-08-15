import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.ArrayList;

public class Item {
    private final Connection conn;
    private int id;
    private String name;
    private int price;
    private int restid;

    public Item(Connection conn) {
        this.conn = conn;
    }

    public Item(int id, String name, int price, int restid) {
        this.conn = null;
        this.id = id;
        this.name = name;
        this.price = price;
        this.restid = restid;
    }

    public boolean insertItem(int id, String name, int price, int restid) {
        String sql = "INSERT INTO Item (id, name, price, restid) VALUES (?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setString(2, name);
            ps.setInt(3, price);
            ps.setInt(4, restid);
            return ps.executeUpdate() == 1;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Item> getItemsByRestaurantId(int restid) {
        List<Item> items = new ArrayList<>();
        String sql = "SELECT id, name, price, restid FROM Item WHERE restid = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, restid);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int id = rs.getInt("id");
                    String name = rs.getString("name");
                    int price = rs.getInt("price");
                    int rid = rs.getInt("restid");
                    items.add(new Item(id, name, price, rid));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
        return items;
    }
}
