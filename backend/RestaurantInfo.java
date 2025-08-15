// File: backend/RestaurantInfo.java
public class RestaurantInfo {
    private final int id;
    private final String name;
    private final double avgRating;

    public RestaurantInfo(int id, String name, double avgRating) {
        this.id = id;
        this.name = name;
        this.avgRating = avgRating;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public double getAvgRating() {
        return avgRating;
    }
}