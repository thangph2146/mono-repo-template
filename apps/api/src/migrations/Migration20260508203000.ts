import { Migration } from '@mikro-orm/migrations';

/**
 * RBAC: permissions, roles, bảng nối; user nhiều role qua users_roles.
 * Chuyển cột legacy `users.role` (enum) sang users_roles rồi xóa cột.
 * Dữ liệu seed gộp ít câu SQL hơn (bulk insert + IN) để giảm overhead khi chạy migration.
 */
export class Migration20260508203000 extends Migration {
  override up(): void {
    this.addSql(`
      create table if not exists \`permissions\` (
        \`id\` int unsigned not null auto_increment,
        \`createdAt\` datetime(6) not null default current_timestamp(6),
        \`updatedAt\` datetime(6) not null default current_timestamp(6) on update current_timestamp(6),
        \`code\` varchar(64) not null,
        \`name\` varchar(120) not null,
        \`description\` text null,
        primary key (\`id\`),
        unique key \`permissions_code_unique\` (\`code\`)
      ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
    `);

    this.addSql(`
      create table if not exists \`roles\` (
        \`id\` int unsigned not null auto_increment,
        \`createdAt\` datetime(6) not null default current_timestamp(6),
        \`updatedAt\` datetime(6) not null default current_timestamp(6) on update current_timestamp(6),
        \`code\` varchar(64) not null,
        \`name\` varchar(120) not null,
        \`description\` text null,
        primary key (\`id\`),
        unique key \`roles_code_unique\` (\`code\`)
      ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
    `);

    this.addSql(`
      create table if not exists \`roles_permissions\` (
        \`id\` int unsigned not null auto_increment,
        \`createdAt\` datetime(6) not null default current_timestamp(6),
        \`updatedAt\` datetime(6) not null default current_timestamp(6) on update current_timestamp(6),
        \`role_id\` int unsigned not null,
        \`permission_id\` int unsigned not null,
        primary key (\`id\`),
        unique key \`roles_permissions_role_permission_unique\` (\`role_id\`, \`permission_id\`),
        key \`roles_permissions_role_id_index\` (\`role_id\`),
        key \`roles_permissions_permission_id_index\` (\`permission_id\`),
        constraint \`fk_rp_role\` foreign key (\`role_id\`) references \`roles\` (\`id\`) on delete cascade,
        constraint \`fk_rp_permission\` foreign key (\`permission_id\`) references \`permissions\` (\`id\`) on delete cascade
      ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
    `);

    this.addSql(`
      create table if not exists \`users_roles\` (
        \`id\` int unsigned not null auto_increment,
        \`createdAt\` datetime(6) not null default current_timestamp(6),
        \`updatedAt\` datetime(6) not null default current_timestamp(6) on update current_timestamp(6),
        \`user_id\` int unsigned not null,
        \`role_id\` int unsigned not null,
        primary key (\`id\`),
        unique key \`users_roles_user_role_unique\` (\`user_id\`, \`role_id\`),
        key \`users_roles_user_id_index\` (\`user_id\`),
        key \`users_roles_role_id_index\` (\`role_id\`),
        constraint \`fk_ur_user\` foreign key (\`user_id\`) references \`users\` (\`id\`) on delete cascade,
        constraint \`fk_ur_role\` foreign key (\`role_id\`) references \`roles\` (\`id\`) on delete cascade
      ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
    `);

    this.addSql(`
      insert ignore into \`permissions\` (\`createdAt\`, \`updatedAt\`, \`code\`, \`name\`)
      values
        (current_timestamp(6), current_timestamp(6), '*', 'Toàn hệ thống'),
        (current_timestamp(6), current_timestamp(6), 'products.read', 'Xem sản phẩm'),
        (current_timestamp(6), current_timestamp(6), 'products.write', 'Quản lý sản phẩm'),
        (current_timestamp(6), current_timestamp(6), 'categories.read', 'Xem danh mục'),
        (current_timestamp(6), current_timestamp(6), 'categories.write', 'Quản lý danh mục'),
        (current_timestamp(6), current_timestamp(6), 'orders.read', 'Xem đơn hàng'),
        (current_timestamp(6), current_timestamp(6), 'orders.write', 'Cập nhật đơn hàng'),
        (current_timestamp(6), current_timestamp(6), 'orders.checkout', 'Đặt hàng'),
        (current_timestamp(6), current_timestamp(6), 'users.manage', 'Quản lý người dùng'),
        (current_timestamp(6), current_timestamp(6), 'users.cart_own', 'Giỏ hàng của tôi'),
        (current_timestamp(6), current_timestamp(6), 'rbac.read', 'Xem role & quyền'),
        (current_timestamp(6), current_timestamp(6), 'data.maintenance', 'Sao lưu / import dữ liệu');
    `);

    this.addSql(`
      insert ignore into \`roles\` (\`createdAt\`, \`updatedAt\`, \`code\`, \`name\`)
      values
        (current_timestamp(6), current_timestamp(6), 'super_admin', 'Siêu quản trị'),
        (current_timestamp(6), current_timestamp(6), 'admin', 'Quản trị'),
        (current_timestamp(6), current_timestamp(6), 'manager', 'Quản lý kho'),
        (current_timestamp(6), current_timestamp(6), 'sales', 'Kinh doanh'),
        (current_timestamp(6), current_timestamp(6), 'customer', 'Khách / đại lý');
    `);

    this.addSql(`
      insert ignore into \`roles_permissions\` (\`createdAt\`, \`updatedAt\`, \`role_id\`, \`permission_id\`)
      select current_timestamp(6), current_timestamp(6), r.id, p.id
      from \`roles\` r
      inner join \`permissions\` p on p.code = '*'
      where r.code = 'super_admin';
    `);

    this.addSql(`
      insert ignore into \`roles_permissions\` (\`createdAt\`, \`updatedAt\`, \`role_id\`, \`permission_id\`)
      select current_timestamp(6), current_timestamp(6), r.id, p.id
      from \`roles\` r
      inner join \`permissions\` p on p.code in (
        'products.read', 'products.write', 'categories.read', 'categories.write',
        'orders.read', 'orders.write', 'orders.checkout', 'users.manage', 'users.cart_own',
        'rbac.read', 'data.maintenance'
      )
      where r.code = 'admin';
    `);

    this.addSql(`
      insert ignore into \`roles_permissions\` (\`createdAt\`, \`updatedAt\`, \`role_id\`, \`permission_id\`)
      select current_timestamp(6), current_timestamp(6), r.id, p.id
      from \`roles\` r
      inner join \`permissions\` p on p.code in (
        'products.read', 'products.write', 'categories.read', 'categories.write',
        'orders.read', 'orders.write', 'orders.checkout', 'rbac.read'
      )
      where r.code = 'manager';
    `);

    this.addSql(`
      insert ignore into \`roles_permissions\` (\`createdAt\`, \`updatedAt\`, \`role_id\`, \`permission_id\`)
      select current_timestamp(6), current_timestamp(6), r.id, p.id
      from \`roles\` r
      inner join \`permissions\` p on p.code in (
        'products.read', 'categories.read', 'orders.read', 'orders.write', 'orders.checkout'
      )
      where r.code = 'sales';
    `);

    this.addSql(`
      insert ignore into \`roles_permissions\` (\`createdAt\`, \`updatedAt\`, \`role_id\`, \`permission_id\`)
      select current_timestamp(6), current_timestamp(6), r.id, p.id
      from \`roles\` r
      inner join \`permissions\` p on p.code in (
        'products.read', 'categories.read', 'orders.read', 'orders.checkout', 'users.cart_own'
      )
      where r.code = 'customer';
    `);

    this.addSql(`
      insert ignore into \`users_roles\` (\`createdAt\`, \`updatedAt\`, \`user_id\`, \`role_id\`)
      select current_timestamp(6), current_timestamp(6), u.id, r.id
      from \`users\` u
      inner join \`roles\` r on r.code = u.\`role\`
      where not exists (
        select 1 from \`users_roles\` ur where ur.\`user_id\` = u.id and ur.\`role_id\` = r.id
      );
    `);

    this.addSql('alter table `users` drop column `role`;');
  }

  override down(): void {
    this.addSql(
      "alter table `users` add column `role` enum('admin','manager','sales','customer') not null default 'customer';",
    );
    this.addSql(`
      update \`users\` u
      inner join (
        select ur.\`user_id\` as uid, min(r.\`code\`) as rcode
        from \`users_roles\` ur
        inner join \`roles\` r on r.id = ur.\`role_id\`
        group by ur.\`user_id\`
      ) x on x.uid = u.id
      set u.\`role\` = cast(x.rcode as char charset utf8mb4);
    `);
    this.addSql('drop table if exists `users_roles`;');
    this.addSql('drop table if exists `roles_permissions`;');
    this.addSql('drop table if exists `roles`;');
    this.addSql('drop table if exists `permissions`;');
  }
}
