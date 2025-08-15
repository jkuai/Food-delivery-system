CREATE TABLE Address_1 (
                           country VARCHAR2(100) NOT NULL,
                           postalcode CHAR(6) NOT NULL,
                           province VARCHAR2(100) NOT NULL,
                           city VARCHAR2(100) NOT NULL,
                           PRIMARY KEY (country, postalcode)
);

CREATE TABLE Address_2 (
                           street_num VARCHAR2(100) NOT NULL,
                           postalcode CHAR(6) NOT NULL,
                           unit VARCHAR2(100) NOT NULL,
                           country VARCHAR2(100) NOT NULL,
                           PRIMARY KEY (street_num, postalcode, unit, country),
                           FOREIGN KEY (country, postalcode)
                               REFERENCES Address_1(country, postalcode)
                                   ON DELETE CASCADE
);

CREATE TABLE Customer (
                          id INTEGER PRIMARY KEY,
                          name VARCHAR2(100) NOT NULL,
                          point INTEGER NOT NULL,
                          street_num VARCHAR2(100),
                          postalcode CHAR(6),
                          unit VARCHAR2(100),
                          country VARCHAR2(100),
                          FOREIGN KEY (street_num, postalcode, unit, country)
                              REFERENCES Address_2(street_num, postalcode, unit, country)
                                  ON DELETE SET NULL
);

CREATE TABLE Restaurant (
                            id INTEGER PRIMARY KEY,
                            name VARCHAR2(100) NOT NULL,
                            street_num VARCHAR2(100) NOT NULL,
                            postalcode CHAR(6) NOT NULL,
                            unit VARCHAR2(100) NOT NULL,
                            country VARCHAR2(100) NOT NULL,
                            FOREIGN KEY (street_num, postalcode, unit, country)
                                REFERENCES Address_2(street_num, postalcode, unit, country)
                                    ON DELETE SET NULL
);

CREATE TABLE Driver (
                        id INTEGER PRIMARY KEY,
                        platenumber VARCHAR2(100) NOT NULL,
                        rating INTEGER NOT NULL
);

CREATE TABLE Payment (
                         cardnumber VARCHAR2(100) PRIMARY KEY,
                         expireddate DATE NOT NULL,
                         CVV CHAR(3) NOT NULL,
                         custid INTEGER,
                         FOREIGN KEY (custid)
                             REFERENCES Customer(id)
                                 ON DELETE SET NULL
);

CREATE TABLE Order_1 (
                         subtotal INTEGER NOT NULL,
                         amountsaved INTEGER NOT NULL,
                         total INTEGER NOT NULL,
                         PRIMARY KEY (subtotal, amountsaved)
);

CREATE TABLE Order_2 (
                         order_number INTEGER PRIMARY KEY,
                         subtotal INTEGER NOT NULL,
                         amountsaved INTEGER NOT NULL,
                         custid INTEGER NOT NULL,
                         restid INTEGER NOT NULL,
                         driveid INTEGER,
                         cardnumber VARCHAR2(100) NOT NULL,

                         FOREIGN KEY (subtotal, amountsaved)
                             REFERENCES Order_1(subtotal, amountsaved),

                         FOREIGN KEY (custid)
                             REFERENCES Customer(id)
                                 ON DELETE CASCADE,

                         FOREIGN KEY (restid)
                             REFERENCES Restaurant(id)
                                 ON DELETE CASCADE,

                         FOREIGN KEY (driveid)
                             REFERENCES Driver(id)
                                 ON DELETE SET NULL,

                         FOREIGN KEY (cardnumber)
                             REFERENCES Payment(cardnumber)
                                 ON DELETE CASCADE
);

CREATE TABLE Discount (
                          amountsaved INTEGER NOT NULL,
                          ordernum INTEGER NOT NULL,
                          expirydate DATE NOT NULL,
                          PRIMARY KEY (amountsaved, ordernum),
                          FOREIGN KEY (ordernum)
                              REFERENCES Order_2(order_number)
                                  ON DELETE CASCADE
);

CREATE TABLE Item (
                      id INTEGER PRIMARY KEY,
                      name VARCHAR2(100) NOT NULL,
                      price INTEGER NOT NULL,
                      restid INTEGER NOT NULL,
                      FOREIGN KEY (restid)
                          REFERENCES Restaurant(id)
                              ON DELETE CASCADE
);

CREATE TABLE Order_Item (
                            ordernum INTEGER NOT NULL,
                            itemid INTEGER NOT NULL,
                            quantity INTEGER NOT NULL,
                            PRIMARY KEY (ordernum, itemid),
                            FOREIGN KEY (ordernum)
                                REFERENCES Order_2(order_number)
                                    ON DELETE CASCADE,
                            FOREIGN KEY (itemid)
                                REFERENCES Item(id)
                                    ON DELETE CASCADE
);

CREATE TABLE Review (
                        review# INTEGER PRIMARY KEY,
                        rating VARCHAR2(100) NOT NULL,
                        custid INTEGER NOT NULL,
                        driveid INTEGER,
                        restid INTEGER,
                        FOREIGN KEY (custid)
                            REFERENCES Customer(id)
                                ON DELETE SET NULL,
                        FOREIGN KEY (driveid)
                            REFERENCES Driver(id)
                                ON DELETE SET NULL,
                        FOREIGN KEY (restid)
                            REFERENCES Restaurant(id)
                                ON DELETE SET NULL


);

 INSERT INTO Address_1 VALUES ('Canada', 'B2C3D4', 'British Columbia', 'Vancouver');
 INSERT INTO Address_1 VALUES ('Canada', 'R1T2M3', 'Alberta', 'Calgary');
 INSERT INTO Address_1 VALUES ('Canada', 'K1O2C4', 'Ontario', 'Toronto');
 INSERT INTO Address_1 VALUES ('Canada', 'L9N0F0', 'British Columbia', 'Surrey');
 INSERT INTO Address_1 VALUES ('Canada', 'T5T5T5', 'Manitoba', 'Winnipeg');
 INSERT INTO Address_1 VALUES ('Canada', 'A1B2C3', 'British Columbia', 'Vancouver');
 -- dummy customer address 1
 INSERT INTO Address_1 VALUES ('Canada', 'J9K9K9', 'British Columbia', 'Vancouver');

 INSERT INTO Address_2 VALUES ('456 Yew St', 'B2C3D4', '100', 'Canada');
 INSERT INTO Address_2 VALUES ('111 Oak St', 'R1T2M3', '211', 'Canada');
 INSERT INTO Address_2 VALUES ('220 Main St', 'K1O2C4', '001', 'Canada');
 INSERT INTO Address_2 VALUES ('123 Pine St', 'L9N0F0', '330', 'Canada');
 INSERT INTO Address_2 VALUES ('404 Elm St', 'T5T5T5', '005', 'Canada');
 INSERT INTO Address_2 VALUES ('123 Main St', 'A1B2C3', '003', 'Canada');
 -- dummy customer address 2
 INSERT INTO Address_2 VALUES ('122 Yew St', 'J9K9K9', '290', 'Canada');

 -- pre-set restaurants
 INSERT INTO Restaurant VALUES ('1', 'SUBWAY', '456 Yew St', 'B2C3D4', '100', 'Canada');
 INSERT INTO Restaurant VALUES ('2', 'A&W', '111 Oak St', 'R1T2M3', '211', 'Canada');
 INSERT INTO Restaurant VALUES ('3', 'Steves Poke','220 Main St', 'K1O2C4', '001', 'Canada');
 INSERT INTO Restaurant VALUES ('4', 'Downlow Chicken', '123 Pine St', 'L9N0F0', '330', 'Canada');
 INSERT INTO Restaurant VALUES ('5', 'McDonalds', '404 Elm St', 'T5T5T5', '005', 'Canada');
 INSERT INTO Restaurant VALUES ('6', 'Tim Hortons', '123 Main St', 'A1B2C3', '003', 'Canada');

-- -- dummy customer
 INSERT INTO Customer VALUES ('123', 'Martha', '0', '122 Yew St', 'J9K9K9', '290', 'Canada');
INSERT INTO Customer VALUES ('100', 'Hi', '0', '220 Main St', 'K1O2C4', '001', 'Canada');

 -- Subway items
 INSERT INTO Item VALUES ('11', 'Canadian', '10', '1');
 INSERT INTO Item VALUES ('22', 'Meatbal', '10', '1');
 INSERT INTO Item VALUES ('33', 'Steak', '10', '1');
 -- A&W items
 INSERT INTO Item VALUES ('44', 'Grandpa Burger', '10', '2');
 INSERT INTO Item VALUES ('55', 'Teen Burger', '10', '2');
 INSERT INTO Item VALUES ('66', 'Breakfast', '10', '2');
 -- Poke items
 INSERT INTO Item VALUES ('77', 'Tuna', '10', '3');
 INSERT INTO Item VALUES ('88', 'Salmon', '10', '3');
 INSERT INTO Item VALUES ('99', 'Scallop', '10', '3');
 -- Downlow chicken items
 INSERT INTO Item VALUES ('111', 'Regular', '10', '4');
 INSERT INTO Item VALUES ('222', 'Spicy', '10', '4');
 INSERT INTO Item VALUES ('333', 'Honey Mustard', '10', '4');
 -- Mcdonald items
 INSERT INTO Item VALUES ('444', 'Beef', '10', '5');
 INSERT INTO Item VALUES ('555', 'Chicken', '10', '5');
 INSERT INTO Item VALUES ('666', 'Fish', '10', '5');
 -- tim hortons items
 INSERT INTO Item VALUES ('777', 'Timbit', '10', '6');
 INSERT INTO Item VALUES ('888', 'Coffee', '10', '6');
 INSERT INTO Item VALUES ('999', 'Donut', '10', '6');

 --dummy customer payment information
 INSERT INTO Payment VALUES ('1234567890123456', TO_DATE('2025-12-31', 'YYYY-MM-DD'), '987', '123');

 -- dummy customer order
 INSERT INTO Order_1 VALUES ('100', '10', '90');
 INSERT INTO Order_2 VALUES ('01', '100', '10', '123', '1', NULL, '1234567890123456');

-- review
INSERT INTO Review VALUES ('101', '5', '123', NULL, '1');
INSERT INTO Review VALUES ('102', '3', '123', NULL, '2');
INSERT INTO Review VALUES ('103', '1', '123', NULL, '3');
INSERT INTO Review VALUES ('104', '4', '123', NULL, '4');
INSERT INTO Review VALUES ('105', '5', '123', NULL, '5');
INSERT INTO Review VALUES ('106', '2', '123', NULL, '6');


