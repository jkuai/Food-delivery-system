package com.example.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Date;
import java.time.LocalDate;
import java.util.Map;
import com.example.dao.Order;
import com.example.dao.Discount;

@RestController
@RequestMapping("/api/orders/{orderNum}/discount")
public class DiscountController {
    private final DataSource dataSource;

    public DiscountController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/info")
    public ResponseEntity<DiscountInfoDto> getDiscountInfo(@PathVariable int orderNum) {
        try (Connection conn = dataSource.getConnection()) {
            Order orderDao = new Order(conn);
            Discount discountDao = new Discount(conn);

            Map<String,Object> orderMap = orderDao.getOrderDetails(orderNum);
            Map<String,Object> discMap = discountDao.getDiscount(orderNum);

            int originalPrice = (int) orderMap.get("subtotal");
            int discountAmount = discMap != null ? (int) discMap.get("amountsaved") : 0;
            LocalDate expiryDate = discMap != null
                    ? ((Date) discMap.get("expirydate")).toLocalDate()
                    : null;
            boolean expired = expiryDate != null && expiryDate.isBefore(LocalDate.now());
            int finalPrice = (int) orderMap.get("total");

            DiscountInfoDto dto = new DiscountInfoDto(
                    orderNum,
                    originalPrice,
                    discountAmount,
                    expiryDate,
                    finalPrice,
                    expired
            );
            return ResponseEntity.ok(dto);
        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<String> applyDiscount(
            @PathVariable int orderNum,
            @RequestBody DiscountRequestDto request
    ) {
        try (Connection conn = dataSource.getConnection()) {
            Discount discountDao = new Discount(conn);
            boolean success = discountDao.applyDiscount(
                    request.getAmountSaved(),
                    orderNum,
                    Date.valueOf(request.getExpiryDate())
            );
            if (success) {
                return ResponseEntity.ok("Discount applied");
            } else {
                return ResponseEntity.badRequest().body("Failed to apply discount");
            }
        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Database error");
        }
    }

    public static class DiscountInfoDto {
        private int orderNum;
        private int originalPrice;
        private int discountAmount;
        private LocalDate expiryDate;
        private int finalPrice;
        private boolean expired;

        public DiscountInfoDto(int orderNum, int originalPrice, int discountAmount, LocalDate expiryDate, int finalPrice, boolean expired) {
            this.orderNum = orderNum;
            this.originalPrice = originalPrice;
            this.discountAmount = discountAmount;
            this.expiryDate = expiryDate;
            this.finalPrice = finalPrice;
            this.expired = expired;
        }

        public int getOrderNum() { return orderNum; }
        public int getOriginalPrice() { return originalPrice; }
        public int getDiscountAmount() { return discountAmount; }
        public LocalDate getExpiryDate() { return expiryDate; }
        public int getFinalPrice() { return finalPrice; }
        public boolean isExpired() { return expired; }
    }

    public static class DiscountRequestDto {
        private int amountSaved;
        private LocalDate expiryDate;

        public int getAmountSaved() { return amountSaved; }
        public void setAmountSaved(int amountSaved) { this.amountSaved = amountSaved; }
        public LocalDate getExpiryDate() { return expiryDate; }
        public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    }
}
