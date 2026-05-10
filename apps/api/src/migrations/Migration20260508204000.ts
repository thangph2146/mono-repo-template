import { Migration } from '@mikro-orm/migrations';

/**
 * Bảng catalog + đơn hàng — cần cho `migration:fresh --seed` (seeder tạo sản phẩm / đơn mẫu).
 * Cột camelCase khớp entity + {@link EntityCaseNamingStrategy}.
 */
export class Migration20260508204000 extends Migration {
  override up(): void {
    this.addSql(`
      create table if not exists \`products\` (
        \`id\` int unsigned not null auto_increment,
        \`createdAt\` datetime not null default current_timestamp,
        \`updatedAt\` datetime not null default current_timestamp on update current_timestamp,
        \`sku\` varchar(255) not null,
        \`name\` varchar(255) not null,
        \`description\` text null,
        \`category\` varchar(255) not null,
        \`brand\` varchar(255) null,
        \`origin\` varchar(255) null,
        \`basePrice\` decimal(18,2) not null default 0,
        \`wholesalePrice\` decimal(18,2) not null default 0,
        \`retailPrice\` decimal(18,2) not null default 0,
        \`stock\` int not null default 0,
        \`unit\` varchar(255) not null default 'piece',
        \`unitTypes\` json null,
        \`images\` json null,
        \`coupons\` json null,
        \`isActive\` tinyint(1) not null default 1,
        primary key (\`id\`),
        unique key \`products_sku_unique\` (\`sku\`),
        key \`products_name_index\` (\`name\`),
        key \`products_category_index\` (\`category\`)
      ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
    `);

    this.addSql(`
      create table if not exists \`orders\` (
        \`id\` int unsigned not null auto_increment,
        \`createdAt\` datetime not null default current_timestamp,
        \`updatedAt\` datetime not null default current_timestamp on update current_timestamp,
        \`orderNumber\` varchar(255) not null,
        \`customerId\` int unsigned null,
        \`customerName\` varchar(255) not null,
        \`customerEmail\` varchar(255) not null,
        \`customerPhone\` varchar(255) null,
        \`shippingAddress\` text null,
        \`items\` json not null,
        \`subtotal\` decimal(18,2) not null default 0,
        \`discountAmount\` decimal(18,2) not null default 0,
        \`shippingFee\` decimal(18,2) not null default 0,
        \`totalAmount\` decimal(18,2) not null default 0,
        \`status\` enum('pending','confirmed','shipped','delivered','cancelled') not null default 'pending',
        \`couponCode\` varchar(255) null,
        \`notes\` text null,
        \`paymentMethod\` enum('cod') not null default 'cod',
        \`paymentStatus\` enum('unpaid','paid') not null default 'unpaid',
        \`isPaid\` tinyint(1) not null default 0,
        \`shippedBy\` varchar(255) null,
        \`shippedAt\` datetime null,
        \`deliveredBy\` varchar(255) null,
        \`deliveredAt\` datetime null,
        \`cancelledAt\` datetime null,
        primary key (\`id\`),
        unique key \`orders_order_number_unique\` (\`orderNumber\`),
        key \`orders_status_index\` (\`status\`),
        key \`orders_payment_status_index\` (\`paymentStatus\`),
        key \`orders_customer_id_index\` (\`customerId\`),
        constraint \`orders_customer_id_foreign\` foreign key (\`customerId\`) references \`users\` (\`id\`) on delete set null
      ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
    `);
  }

  override down(): void {
    this.addSql('drop table if exists `orders`');
    this.addSql('drop table if exists `products`');
  }
}
