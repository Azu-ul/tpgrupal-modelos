CREATE DATABASE IF NOT EXISTS resto_db;
USE resto_db;

-- Tabla de personal
CREATE TABLE personal (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'mozo', 'chef', 'cocinero') NOT NULL
);

-- Tabla de mesas
CREATE TABLE mesas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero INT NOT NULL UNIQUE,
    capacidad INT NOT NULL,
    mozo_id INT NULL,
    FOREIGN KEY (mozo_id) REFERENCES personal(id)
);

-- Tabla de menú
CREATE TABLE menu (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    categoria ENUM('entrada', 'principal', 'postre', 'bebida') NOT NULL
);

-- Tabla de pedidos
CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mesa_id INT NOT NULL,
    mozo_id INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'en_preparacion', 'listo', 'entregado', 'pagado') DEFAULT 'pendiente',
    total DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id),
    FOREIGN KEY (mozo_id) REFERENCES personal(id)
);

-- Tabla de items de pedido
CREATE TABLE pedido_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    menu_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (menu_id) REFERENCES menu(id)
);

-- Datos de prueba
INSERT INTO personal (nombre, rol) VALUES
('Admin Principal', 'admin'),
('Juan Pérez', 'mozo'),
('María García', 'mozo'),
('Carlos López', 'mozo'),
('Chef Ramírez', 'chef'),
('Cocinero 1', 'cocinero'),
('Cocinero 2', 'cocinero');

INSERT INTO mesas (numero, capacidad) VALUES
(1, 4), (2, 4), (3, 2), (4, 2), (5, 6), (6, 4), (7, 4), (8, 2), (9, 6), (10, 4);

INSERT INTO menu (nombre, precio, categoria) VALUES
('Ensalada César', 850.00, 'entrada'),
('Provoleta', 950.00, 'entrada'),
('Empanadas (3u)', 1200.00, 'entrada'),
('Bife de Chorizo', 4500.00, 'principal'),
('Ñoquis con Salsa', 2800.00, 'principal'),
('Milanesa Napolitana', 3200.00, 'principal'),
('Pollo al Horno', 2900.00, 'principal'),
('Ravioles', 2600.00, 'principal'),
('Tiramisu', 1400.00, 'postre'),
('Flan Casero', 1100.00, 'postre'),
('Helado (2 bochas)', 900.00, 'postre'),
('Coca Cola', 600.00, 'bebida'),
('Agua Mineral', 400.00, 'bebida'),
('Cerveza', 800.00, 'bebida'),
('Vino Tinto (copa)', 1000.00, 'bebida');