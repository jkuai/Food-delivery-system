import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class Review {
    private final Connection conn;

    public Review(Connection conn) {
        this.conn = conn;
    }

    // Inserts into the review table
    public boolean insertReview(int reviewId, String rating, int custId, Integer driveId, Integer restId) {
        if ((driveId == null && restId == null) || (driveId != null && restId != null)) {
            // Rejects invalid inserts
            System.err.println("Review must be for either a driver or a restaurant, but not both.");
            return false;
        }

        String sql = "INSERT INTO Review (review#, rating, custid, driveid, restid) VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, reviewId);
            ps.setString(2, rating);
            ps.setInt(3, custId);

            // Checks if the review is for a driver
            if (driveId != null) {
                ps.setInt(4, driveId);
            } else {
                ps.setNull(4, java.sql.Types.INTEGER);
            }

            // Checks if the review is for a restaurant
            if (restId != null) {
                ps.setInt(5, restId);
            } else {
                ps.setNull(5, java.sql.Types.INTEGER);
            }

            return ps.executeUpdate() == 1;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // Groups the review by restid and returns the number of review per restaurant
    public void getReviewCountsByRestaurant() {
        String sql = "SELECT restid, COUNT(*) AS review_count " +
                "FROM Review " +
                "WHERE restid IS NOT NULL " +
                "GROUP BY restid";

        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                int restId = rs.getInt("restid");
                int count = rs.getInt("review_count");
                // !!! Change to display in Frontend
                System.out.println("Restaurant ID: " + restId + " - Total Reviews: " + count);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
