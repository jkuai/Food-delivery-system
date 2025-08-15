import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import java.sql.Connection;
import java.sql.SQLException;

@RestController
public class CustomerController {

    @PostMapping("/api/customers")
    public ResponseEntity<String> insertCustomer(@RequestBody CustomerDTO customerDTO) {
        try (Connection conn = OracleConnection.getConnection()) {
            Customer customer = new Customer(conn);
            boolean inserted = customer.insertCustomer(
                    customerDTO.getId(),
                    customerDTO.getName(),
                    customerDTO.getPoint(),
                    customerDTO.getStreetNum(),
                    customerDTO.getPostalcode(),
                    customerDTO.getUnit(),
                    customerDTO.getCountry()
            );

            if (inserted) {
                return ResponseEntity.ok("Customer inserted");
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to insert customer");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Database connection error");
        }
    }
}