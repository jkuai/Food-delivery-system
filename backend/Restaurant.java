import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class Restaurant {
    private final Connection conn;
    private final Address address;

    public Restaurant(Connection conn, Address address) {
        this.conn = conn;
        this.address = address;
    }

    public boolean insertRestaurant(
            int id,
            String name,
            String streetNum,
            String postalcode,
            String unit,
            String country
    ) {
        try {
            conn.setAutoCommit(false);

            // Check for address and insert if needed
            if (!address.addressExists(streetNum, postalcode, unit, country)) {
                boolean inserted = address.insertAddress2(streetNum, postalcode, unit, country);
                if (!inserted) {
                    conn.rollback();
                    System.out.println("Address insert failed.");
                    return false;
                }
            }

            // Insert restaurant
            String sql = "INSERT INTO Restaurant (id, name, street_num, postalcode, unit, country) " +
                         "VALUES (?, ?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, id);
                ps.setString(2, name);
                ps.setString(3, streetNum);
                ps.setString(4, postalcode);
                ps.setString(5, unit);
                ps.setString(6, country);

                int rows = ps.executeUpdate();
                if (rows == 1) {
                    conn.commit();
                    return true;
                } else {
                    conn.rollback();
                    System.out.println("Restaurant insert failed.");
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
    // Finds restaurants with an average rating above a specified threshold
    public List<RestaurantInfo> findRestaurantsWithAvgRatingAbove(double minRating) throws SQLException {
        String sql = "SELECT r.id, r.name, AVG(TO_NUMBER(rv.rating)) AS avg_rating " +
                "FROM Restaurant r " +
                "JOIN Review rv ON r.id = rv.restid " +
                "GROUP BY r.id, r.name " +
                "HAVING AVG(TO_NUMBER(rv.rating)) >= ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, minRating);
            try (ResultSet rs = ps.executeQuery()) {
                List<RestaurantInfo> restaurants = new ArrayList<>();
                while (rs.next()) {
                    int id = rs.getInt("id");
                    String name = rs.getString("name");
                    double avgRating = rs.getDouble("avg_rating");
                    restaurants.add(new RestaurantInfo(id, name, avgRating));
                }
                return restaurants;
            }
        }
    }

    // Get the count of restaurants in each city
    public Map<String, Integer> getRestaurantCountByCity() throws SQLException {
        String sql = "SELECT a.city, COUNT(r.id) AS num_restaurants " +
                "FROM Restaurant r " +
                "JOIN Address_2 a2 ON r.street_num = a2.street_num " +
                "  AND r.postalcode = a2.postalcode " +
                "  AND r.unit = a2.unit " +
                "  AND r.country = a2.country " +
                "JOIN Address_1 a ON a2.country = a.country " +
                "  AND a2.postalcode = a.postalcode " +
                "GROUP BY a.city";
        Map<String, Integer> cityCount = new HashMap<>();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                cityCount.put(rs.getString("city"), rs.getInt("num_restaurants"));
            }
        }
        return cityCount;
    }

}
