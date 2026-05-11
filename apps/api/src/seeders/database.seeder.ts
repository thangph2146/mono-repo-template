import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Category } from '../entities/category.entity';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  type OrderItem,
} from '../entities/order.entity';
import { Permission } from '../entities/permission.entity';
import { Product } from '../entities/product.entity';
import { RolePermissionLink } from '../entities/role-permission-link.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { UserRoleLink } from '../entities/user-role-link.entity';

/** Ảnh phụ dùng chung khi seed chỉ có 1 URL — đảm bảo mỗi SKU có ≥3 hình gallery. */
const GALLERY_EXTRA = [
  'https://images.unsplash.com/photo-1447933601403-0c6688cb97f2?w=800&auto=format&q=82',
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&q=82',
] as const;

function galleryAtLeast3(primary: string): string[] {
  return [primary, GALLERY_EXTRA[0], GALLERY_EXTRA[1]];
}

/**
 * Default seeder executed via `pnpm db:seed`.
 *
 * Adds admin + B2B users, siêu quản trị & user đa role (demo RBAC), categories,
 * catalog (mỗi sản phẩm ≥3 ảnh), và đơn hàng mẫu.
 */
export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (process.env.DB_SEED_VERBOSE === '1') {
      // Giúp phân biệt DB thật khi seed “thành công” nhưng GUI xem nhầm instance/schema.
      const hasUrl = Boolean(process.env.DATABASE_URL);
      console.log(
        '[DatabaseSeeder] DATABASE_URL: %s | DB_CLIENT=%s',
        hasUrl
          ? 'đã set'
          : 'chưa set → API/CLI dùng mặc định (thường là postgresql localhost)',
        process.env.DB_CLIENT ?? '(infer)',
      );
    }
    // Bắt buộc trước user: `schema:fresh --seed` không chạy migration SQL — bảng roles có thể trống.
    await this.ensureRbacBaseline(em);
    await this.seedAdmin(em);
    await this.seedB2bUsers(em);
    await this.seedDemoAccounts(em);
    await this.seedCategories(em);
    await this.seedProducts(em);
    await em.flush();
    await this.seedSampleOrders(em);
    await em.flush();
  }

  /**
   * Đồng bộ nội dung RBAC với migration `Migration20260508203000` (permissions, roles, roles_permissions).
   * An toàn khi chạy lại: chỉ tạo bản ghi / liên kết còn thiếu.
   */
  private async ensureRbacBaseline(em: EntityManager): Promise<void> {
    const permDefs: Array<{ code: string; name: string }> = [
      { code: '*', name: 'Toàn hệ thống' },
      { code: 'products.read', name: 'Xem sản phẩm' },
      { code: 'products.write', name: 'Quản lý sản phẩm' },
      { code: 'categories.read', name: 'Xem danh mục' },
      { code: 'categories.write', name: 'Quản lý danh mục' },
      { code: 'orders.read', name: 'Xem đơn hàng' },
      { code: 'orders.write', name: 'Cập nhật đơn hàng' },
      { code: 'orders.checkout', name: 'Đặt hàng' },
      { code: 'users.manage', name: 'Quản lý người dùng' },
      { code: 'users.cart_own', name: 'Giỏ hàng của tôi' },
      { code: 'rbac.read', name: 'Xem role & quyền' },
      { code: 'data.maintenance', name: 'Sao lưu / import dữ liệu' },
    ];
    for (const p of permDefs) {
      if (!(await em.findOne(Permission, { code: p.code }))) {
        em.create(
          Permission,
          { code: p.code, name: p.name },
          { partial: true },
        );
      }
    }
    await em.flush();

    const roleDefs: Array<{ code: string; name: string }> = [
      { code: 'super_admin', name: 'Siêu quản trị' },
      { code: 'admin', name: 'Quản trị' },
      { code: 'manager', name: 'Quản lý kho' },
      { code: 'sales', name: 'Kinh doanh' },
      { code: 'shipper', name: 'Giao hàng' },
      { code: 'customer', name: 'Khách / đại lý' },
    ];
    for (const r of roleDefs) {
      if (!(await em.findOne(Role, { code: r.code }))) {
        em.create(Role, { code: r.code, name: r.name }, { partial: true });
      }
    }
    await em.flush();

    const getPerm = async (code: string) => {
      const p = await em.findOne(Permission, { code });
      if (!p) throw new Error(`[ensureRbacBaseline] Thiếu permission: ${code}`);
      return p;
    };
    const getRole = async (code: string) => {
      const r = await em.findOne(Role, { code });
      if (!r) throw new Error(`[ensureRbacBaseline] Thiếu role: ${code}`);
      return r;
    };

    const linkRolePerms = async (roleCode: string, permCodes: string[]) => {
      const r = await getRole(roleCode);
      for (const c of permCodes) {
        const p = await getPerm(c);
        const exists = await em.findOne(RolePermissionLink, {
          role: r,
          permission: p,
        });
        if (exists) continue;
        em.create(
          RolePermissionLink,
          { role: r, permission: p },
          { partial: true },
        );
      }
    };

    await linkRolePerms('super_admin', ['*']);
    await linkRolePerms('admin', [
      'products.read',
      'products.write',
      'categories.read',
      'categories.write',
      'orders.read',
      'orders.write',
      'orders.checkout',
      'users.manage',
      'users.cart_own',
      'rbac.read',
      'data.maintenance',
    ]);
    await linkRolePerms('manager', [
      'products.read',
      'products.write',
      'categories.read',
      'categories.write',
      'orders.read',
      'orders.write',
      'orders.checkout',
      'rbac.read',
    ]);
    await linkRolePerms('sales', [
      'products.read',
      'categories.read',
      'orders.read',
      'orders.write',
      'orders.checkout',
    ]);
    await linkRolePerms('shipper', [
      'products.read',
      'categories.read',
      'orders.read',
      'orders.write',
    ]);
    await linkRolePerms('customer', [
      'products.read',
      'categories.read',
      'orders.read',
      'orders.checkout',
      'users.cart_own',
    ]);
    await em.flush();
  }

  private async linkUserToRoles(
    em: EntityManager,
    email: string,
    roleCodes: string[],
  ): Promise<void> {
    const user = await em.findOne(User, { email });
    if (!user) return;
    const roles = await em.find(Role, { code: { $in: roleCodes } });
    for (const role of roles) {
      const exists = await em.findOne(UserRoleLink, { user, role });
      if (exists) continue;
      em.persist(em.create(UserRoleLink, { user, role }, { partial: true }));
    }
  }

  private async seedB2bUsers(em: EntityManager): Promise<void> {
    const users: Array<{
      email: string;
      fullName: string;
      roleCodes: string[];
      phone?: string;
      address?: string;
    }> = [
      {
        email: 'manager@storesync.local',
        fullName: 'Quản lý kho',
        roleCodes: ['manager'],
      },
      {
        email: 'sales@storesync.local',
        fullName: 'Nhân viên kinh doanh',
        roleCodes: ['sales'],
      },
      {
        email: 'shipper@storesync.local',
        fullName: 'Nguyễn Văn Shipper',
        roleCodes: ['shipper'],
      },
      {
        email: 'shipper2@storesync.local',
        fullName: 'Trần Thị Giao',
        roleCodes: ['shipper'],
      },
      {
        email: 'khach-demo@storesync.local',
        fullName: 'Đại lý Nam Sơn',
        roleCodes: ['customer'],
        phone: '02837123456',
        address: '120 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      },
    ];
    for (const u of users) {
      if (await em.findOne(User, { email: u.email })) continue;
      const { roleCodes, ...userFields } = u;
      void roleCodes;
      em.create(
        User,
        {
          ...userFields,
          password: 'demo',
          isActive: true,
        },
        { partial: true },
      );
    }
    await em.flush();
    for (const u of users) {
      await this.linkUserToRoles(em, u.email, u.roleCodes);
    }
  }

  /**
   * Tài khoản bổ sung: siêu quản trị (`super_admin`) và user **hai role**
   * (sales + customer) để kiểm thử union quyền.
   */
  private async seedDemoAccounts(em: EntityManager): Promise<void> {
    const accounts: Array<{
      email: string;
      fullName: string;
      password: string;
      roleCodes: string[];
    }> = [
      {
        email: 'super@storesync.local',
        fullName: 'Siêu quản trị (demo)',
        password: 'demo',
        roleCodes: ['super_admin'],
      },
      {
        email: 'hybrid@storesync.local',
        fullName: 'NVKD + đại lý (đa role)',
        password: 'demo',
        roleCodes: ['sales', 'customer'],
      },
    ];
    for (const a of accounts) {
      if (await em.findOne(User, { email: a.email })) continue;
      em.create(
        User,
        {
          email: a.email,
          fullName: a.fullName,
          password: a.password,
          isActive: true,
        },
        { partial: true },
      );
    }
    await em.flush();
    for (const a of accounts) {
      await this.linkUserToRoles(em, a.email, a.roleCodes);
    }
  }

  private async seedSampleOrders(em: EntityManager): Promise<void> {
    const cust = await em.findOne(User, {
      email: 'khach-demo@storesync.local',
    });
    const coffee = await em.findOne(Product, { sku: 'SP-COFFEE-01' });
    const noodle = await em.findOne(Product, { sku: 'SP-NOODLE-01' });
    const coke = await em.findOne(Product, { sku: 'SP-COKE-01' });
    if (!cust || !coffee || !noodle || !coke) return;

    const orderNumbers = [
      'ORD-SEED-001',
      'ORD-SEED-002',
      'ORD-SEED-003',
    ] as const;

    if (!(await em.findOne(Order, { orderNumber: orderNumbers[0] }))) {
      const items1: OrderItem[] = [
        {
          productId: coffee.id,
          sku: coffee.sku,
          name: coffee.name,
          quantity: 2,
          unitType: 'gói',
          unitPrice: 180000,
          totalPrice: 360000,
          qtyPerUnit: 1,
          image: coffee.images?.[0],
        },
      ];
      em.create(
        Order,
        {
          orderNumber: orderNumbers[0],
          customer: cust,
          customerName: cust.fullName,
          customerEmail: cust.email,
          customerPhone: '0901000001',
          shippingAddress: '120 Nguyễn Huệ, Quận 1, TP.HCM',
          items: items1,
          subtotal: 360000,
          discountAmount: 0,
          shippingFee: 0,
          totalAmount: 360000,
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.UNPAID,
          isPaid: false,
        },
        { partial: true },
      );
    }

    if (!(await em.findOne(Order, { orderNumber: orderNumbers[1] }))) {
      const items2: OrderItem[] = [
        {
          productId: noodle.id,
          sku: noodle.sku,
          name: noodle.name,
          quantity: 3,
          unitType: 'thùng',
          unitPrice: 109000,
          totalPrice: 327000,
          qtyPerUnit: 30,
          image: noodle.images?.[0],
        },
      ];
      em.create(
        Order,
        {
          orderNumber: orderNumbers[1],
          customer: cust,
          customerName: cust.fullName,
          customerEmail: cust.email,
          customerPhone: '0901000001',
          shippingAddress: '45 Lê Lợi, Quận 1, TP.HCM',
          items: items2,
          subtotal: 327000,
          discountAmount: 0,
          shippingFee: 0,
          totalAmount: 327000,
          status: OrderStatus.CONFIRMED,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.UNPAID,
          isPaid: false,
        },
        { partial: true },
      );
    }

    if (!(await em.findOne(Order, { orderNumber: orderNumbers[2] }))) {
      const items3: OrderItem[] = [
        {
          productId: coke.id,
          sku: coke.sku,
          name: coke.name,
          quantity: 1,
          unitType: 'lốc',
          unitPrice: 70000,
          totalPrice: 70000,
          qtyPerUnit: 6,
          image: coke.images?.[0],
        },
        {
          productId: coffee.id,
          sku: coffee.sku,
          name: coffee.name,
          quantity: 1,
          unitType: 'gói',
          unitPrice: 180000,
          totalPrice: 180000,
          qtyPerUnit: 1,
          image: coffee.images?.[1] ?? coffee.images?.[0],
        },
      ];
      em.create(
        Order,
        {
          orderNumber: orderNumbers[2],
          customer: cust,
          customerName: cust.fullName,
          customerEmail: cust.email,
          customerPhone: '0902000002',
          shippingAddress: '88 Pasteur, Quận 1, TP.HCM',
          items: items3,
          subtotal: 250000,
          discountAmount: 0,
          shippingFee: 0,
          totalAmount: 250000,
          status: OrderStatus.SHIPPED,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.UNPAID,
          isPaid: false,
        },
        { partial: true },
      );
    }
  }

  private async seedAdmin(em: EntityManager): Promise<void> {
    const adminEmail = 'admin@storesync.local';
    if (await em.findOne(User, { email: adminEmail })) return;
    em.create(
      User,
      {
        email: adminEmail,
        password: 'change-me',
        fullName: 'Default Admin',
        isActive: true,
      },
      { partial: true },
    );
    await em.flush();
    await this.linkUserToRoles(em, adminEmail, ['admin']);
  }

  private async seedCategories(em: EntityManager): Promise<void> {
    const categories: Array<Partial<Category>> = [
      {
        slug: 'do-uong',
        name: 'Đồ uống',
        description: 'Cà phê, trà, nước giải khát',
        icon: 'Coffee',
        sortOrder: 1,
        isActive: true,
      },
      {
        slug: 'thuc-pham',
        name: 'Thực phẩm',
        description: 'Gạo, mì, đồ khô, đồ hộp',
        icon: 'UtensilsCrossed',
        sortOrder: 2,
        isActive: true,
      },
      {
        slug: 'sua-bot',
        name: 'Sữa & Bột',
        description: 'Sữa tươi, sữa bột, ngũ cốc',
        icon: 'Milk',
        sortOrder: 3,
        isActive: true,
      },
      {
        slug: 'gia-vi',
        name: 'Gia vị',
        description: 'Nước mắm, dầu ăn, đường, muối',
        icon: 'Soup',
        sortOrder: 4,
        isActive: true,
      },
    ];

    for (const data of categories) {
      const exists = await em.findOne(Category, { slug: data.slug! });
      if (exists) continue;
      em.create(Category, data, { partial: true });
    }
  }

  private async seedProducts(em: EntityManager): Promise<void> {
    const sampleProducts: Array<Partial<Product>> = [
      // ----- Đồ uống (do-uong) -----
      {
        sku: 'SP-COFFEE-01',
        name: 'Cà phê hạt rang Arabica 250g',
        description:
          'Hạt cà phê Arabica Buôn Ma Thuột rang vừa, hương thơm cân bằng phù hợp pha máy.',
        category: 'do-uong',
        brand: 'Highlands',
        origin: 'Việt Nam',
        unit: 'gói',
        basePrice: 120000,
        retailPrice: 180000,
        wholesalePrice: 150000,
        stock: 600,
        images: [
          'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600',
        ],
        unitTypes: [
          {
            type: 'gói',
            label: 'Gói 250g',
            wholesalePrice: null,
            retailPrice: 180000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 24 gói',
            wholesalePrice: 3500000,
            retailPrice: 4000000,
            minWholesaleQty: 1,
            qtyPerUnit: 24,
          },
        ],
      },
      {
        sku: 'SP-COKE-01',
        name: 'Coca-Cola lon 320ml',
        description:
          'Nước giải khát có gas, lon 320ml, đóng thùng 24 lon tiện cho cửa hàng.',
        category: 'do-uong',
        brand: 'Coca-Cola',
        origin: 'Việt Nam',
        unit: 'lon',
        basePrice: 8000,
        retailPrice: 12000,
        wholesalePrice: 9500,
        stock: 4800,
        images: [
          'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600',
        ],
        unitTypes: [
          {
            type: 'lon',
            label: 'Lon 320ml',
            wholesalePrice: null,
            retailPrice: 12000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'lốc',
            label: 'Lốc 6 lon',
            wholesalePrice: 60000,
            retailPrice: 70000,
            minWholesaleQty: 1,
            qtyPerUnit: 6,
          },
          {
            type: 'thùng',
            label: 'Thùng 24 lon',
            wholesalePrice: 220000,
            retailPrice: 270000,
            minWholesaleQty: 1,
            qtyPerUnit: 24,
          },
        ],
        coupons: ['Giảm 10% đơn ≥ 5 thùng'],
      },
      {
        sku: 'SP-PEPSI-01',
        name: 'Pepsi chai 1.5L',
        description:
          'Nước ngọt có gas Pepsi, chai 1.5L, tiện dùng cho gia đình.',
        category: 'do-uong',
        brand: 'Pepsi',
        origin: 'Việt Nam',
        unit: 'chai',
        basePrice: 16000,
        retailPrice: 22000,
        wholesalePrice: 18000,
        stock: 720,
        images: [
          'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600',
        ],
        unitTypes: [
          {
            type: 'chai',
            label: 'Chai 1.5L',
            wholesalePrice: null,
            retailPrice: 22000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 12 chai',
            wholesalePrice: 210000,
            retailPrice: 240000,
            minWholesaleQty: 1,
            qtyPerUnit: 12,
          },
        ],
      },
      {
        sku: 'SP-TEA-01',
        name: 'Trà xanh 0 độ chai 500ml',
        description: 'Trà xanh đóng chai, vị thanh mát giải nhiệt.',
        category: 'do-uong',
        brand: 'TanHiepPhat',
        origin: 'Việt Nam',
        unit: 'chai',
        basePrice: 8500,
        retailPrice: 12000,
        wholesalePrice: 10000,
        stock: 1500,
        images: [
          'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600',
        ],
        unitTypes: [
          {
            type: 'chai',
            label: 'Chai 500ml',
            wholesalePrice: null,
            retailPrice: 12000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 24 chai',
            wholesalePrice: 230000,
            retailPrice: 270000,
            minWholesaleQty: 1,
            qtyPerUnit: 24,
          },
        ],
      },
      {
        sku: 'SP-BEER-01',
        name: 'Bia Tiger lon 330ml',
        description: 'Bia Tiger lon, đóng thùng 24 lon dành cho đại lý.',
        category: 'do-uong',
        brand: 'Tiger',
        origin: 'Việt Nam',
        unit: 'lon',
        basePrice: 16000,
        retailPrice: 22000,
        wholesalePrice: 18500,
        stock: 2400,
        images: [
          'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600',
        ],
        unitTypes: [
          {
            type: 'lon',
            label: 'Lon 330ml',
            wholesalePrice: null,
            retailPrice: 22000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 24 lon',
            wholesalePrice: 420000,
            retailPrice: 510000,
            minWholesaleQty: 1,
            qtyPerUnit: 24,
          },
        ],
        coupons: ['Tặng 1 ly khi mua 5 thùng'],
      },

      // ----- Thực phẩm (thuc-pham) -----
      {
        sku: 'SP-RICE-01',
        name: 'Gạo ST25 bao 5kg',
        description:
          'Gạo ST25 hạt dài, dẻo thơm, thương hiệu Việt 3 năm liền top thế giới.',
        category: 'thuc-pham',
        brand: 'ST25',
        origin: 'Sóc Trăng',
        unit: 'bao',
        basePrice: 130000,
        retailPrice: 175000,
        wholesalePrice: 155000,
        stock: 400,
        images: [
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
        ],
        unitTypes: [
          {
            type: 'bao',
            label: 'Bao 5kg',
            wholesalePrice: null,
            retailPrice: 175000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 4 bao',
            wholesalePrice: 600000,
            retailPrice: 700000,
            minWholesaleQty: 1,
            qtyPerUnit: 4,
          },
        ],
      },
      {
        sku: 'SP-NOODLE-01',
        name: 'Mì Hảo Hảo tôm chua cay',
        description: 'Mì gói Hảo Hảo vị tôm chua cay, đóng thùng 30 gói.',
        category: 'thuc-pham',
        brand: 'Hảo Hảo',
        origin: 'Việt Nam',
        unit: 'gói',
        basePrice: 4000,
        retailPrice: 5500,
        wholesalePrice: 4500,
        stock: 9000,
        images: [
          'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=600',
        ],
        unitTypes: [
          {
            type: 'gói',
            label: 'Gói 75g',
            wholesalePrice: null,
            retailPrice: 5500,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'lốc',
            label: 'Lốc 5 gói',
            wholesalePrice: 22000,
            retailPrice: 26000,
            minWholesaleQty: 1,
            qtyPerUnit: 5,
          },
          {
            type: 'thùng',
            label: 'Thùng 30 gói',
            wholesalePrice: 109000,
            retailPrice: 135000,
            minWholesaleQty: 1,
            qtyPerUnit: 30,
          },
        ],
        coupons: ['Sale -20%'],
      },
      {
        sku: 'SP-FISH-CAN-01',
        name: 'Cá hộp 3 cô gái 155g',
        description:
          'Cá hộp sốt cà thương hiệu 3 cô gái, hộp 155g, bảo quản dễ dàng.',
        category: 'thuc-pham',
        brand: '3 cô gái',
        origin: 'Thái Lan',
        unit: 'hộp',
        basePrice: 18000,
        retailPrice: 25000,
        wholesalePrice: 21000,
        stock: 1200,
        images: [
          'https://images.unsplash.com/photo-1604908554027-71a3ce97c0a9?w=600',
        ],
        unitTypes: [
          {
            type: 'hộp',
            label: 'Hộp 155g',
            wholesalePrice: null,
            retailPrice: 25000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 24 hộp',
            wholesalePrice: 480000,
            retailPrice: 580000,
            minWholesaleQty: 1,
            qtyPerUnit: 24,
          },
        ],
      },
      {
        sku: 'SP-SUGAR-01',
        name: 'Đường tinh luyện Biên Hòa 1kg',
        description: 'Đường cát trắng tinh luyện 1kg.',
        category: 'thuc-pham',
        brand: 'Biên Hòa',
        origin: 'Việt Nam',
        unit: 'gói',
        basePrice: 22000,
        retailPrice: 28000,
        wholesalePrice: 24000,
        stock: 800,
        images: [
          'https://images.unsplash.com/photo-1598454443680-e76935a06b73?w=600',
        ],
        unitTypes: [
          {
            type: 'gói',
            label: 'Gói 1kg',
            wholesalePrice: null,
            retailPrice: 28000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 10kg',
            wholesalePrice: 230000,
            retailPrice: 260000,
            minWholesaleQty: 1,
            qtyPerUnit: 10,
          },
        ],
      },

      // ----- Sữa & Bột (sua-bot) -----
      {
        sku: 'SP-MILK-01',
        name: 'Sữa tươi tiệt trùng Vinamilk 1L',
        description:
          'Sữa tươi tiệt trùng nguyên chất, hộp giấy 1 lít, đóng thùng 12 hộp.',
        category: 'sua-bot',
        brand: 'Vinamilk',
        origin: 'Việt Nam',
        unit: 'hộp',
        basePrice: 28000,
        retailPrice: 35000,
        wholesalePrice: 31000,
        stock: 600,
        images: [
          'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600',
        ],
        unitTypes: [
          {
            type: 'hộp',
            label: 'Hộp 1L',
            wholesalePrice: null,
            retailPrice: 35000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'lốc',
            label: 'Lốc 4 hộp',
            wholesalePrice: 124000,
            retailPrice: 140000,
            minWholesaleQty: 1,
            qtyPerUnit: 4,
          },
          {
            type: 'thùng',
            label: 'Thùng 12 hộp',
            wholesalePrice: 360000,
            retailPrice: 420000,
            minWholesaleQty: 1,
            qtyPerUnit: 12,
          },
        ],
      },
      {
        sku: 'SP-MILK-180-01',
        name: 'Sữa Vinamilk 180ml hộp giấy',
        description: 'Sữa hộp giấy 180ml, lốc 4 hộp tiện cho học sinh.',
        category: 'sua-bot',
        brand: 'Vinamilk',
        origin: 'Việt Nam',
        unit: 'hộp',
        basePrice: 7000,
        retailPrice: 9500,
        wholesalePrice: 8000,
        stock: 4800,
        images: [
          'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
        ],
        unitTypes: [
          {
            type: 'hộp',
            label: 'Hộp 180ml',
            wholesalePrice: null,
            retailPrice: 9500,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'lốc',
            label: 'Lốc 4 hộp',
            wholesalePrice: 32000,
            retailPrice: 38000,
            minWholesaleQty: 1,
            qtyPerUnit: 4,
          },
          {
            type: 'thùng',
            label: 'Thùng 48 hộp',
            wholesalePrice: 380000,
            retailPrice: 450000,
            minWholesaleQty: 1,
            qtyPerUnit: 48,
          },
        ],
      },
      {
        sku: 'SP-FORMULA-01',
        name: 'Sữa bột Dielac Alpha 900g',
        description: 'Sữa bột công thức cho trẻ trên 1 tuổi, hộp 900g.',
        category: 'sua-bot',
        brand: 'Dielac',
        origin: 'Việt Nam',
        unit: 'hộp',
        basePrice: 280000,
        retailPrice: 360000,
        wholesalePrice: 320000,
        stock: 200,
        images: [
          'https://images.unsplash.com/photo-1599486484411-cd1d3a73c10c?w=600',
        ],
        unitTypes: [
          {
            type: 'hộp',
            label: 'Hộp 900g',
            wholesalePrice: null,
            retailPrice: 360000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 6 hộp',
            wholesalePrice: 1850000,
            retailPrice: 2100000,
            minWholesaleQty: 1,
            qtyPerUnit: 6,
          },
        ],
      },
      {
        sku: 'SP-CEREAL-01',
        name: 'Ngũ cốc Nestlé Koko Krunch 330g',
        description: 'Ngũ cốc dinh dưỡng vị socola, hộp 330g.',
        category: 'sua-bot',
        brand: 'Nestlé',
        origin: 'Malaysia',
        unit: 'hộp',
        basePrice: 75000,
        retailPrice: 110000,
        wholesalePrice: 92000,
        stock: 300,
        images: [
          'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=600',
        ],
        unitTypes: [
          {
            type: 'hộp',
            label: 'Hộp 330g',
            wholesalePrice: null,
            retailPrice: 110000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 12 hộp',
            wholesalePrice: 1080000,
            retailPrice: 1280000,
            minWholesaleQty: 1,
            qtyPerUnit: 12,
          },
        ],
      },

      // ----- Gia vị (gia-vi) -----
      {
        sku: 'SP-SAUCE-01',
        name: 'Nước mắm cá cơm Phú Quốc 500ml',
        description:
          'Nước mắm truyền thống Phú Quốc, độ đạm 30N, chai thủy tinh 500ml.',
        category: 'gia-vi',
        brand: 'Phú Quốc',
        origin: 'Phú Quốc',
        unit: 'chai',
        basePrice: 45000,
        retailPrice: 65000,
        wholesalePrice: 55000,
        stock: 240,
        images: [
          'https://images.unsplash.com/photo-1547592180-85f173990554?w=600',
        ],
        unitTypes: [
          {
            type: 'chai',
            label: 'Chai 500ml',
            wholesalePrice: null,
            retailPrice: 65000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 12 chai',
            wholesalePrice: 660000,
            retailPrice: 780000,
            minWholesaleQty: 1,
            qtyPerUnit: 12,
          },
        ],
      },
      {
        sku: 'SP-OIL-01',
        name: 'Dầu ăn Tường An Cooking Oil 1L',
        description: 'Dầu ăn tinh luyện thực vật, chai 1L.',
        category: 'gia-vi',
        brand: 'Tường An',
        origin: 'Việt Nam',
        unit: 'chai',
        basePrice: 38000,
        retailPrice: 52000,
        wholesalePrice: 44000,
        stock: 600,
        images: [
          'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600',
        ],
        unitTypes: [
          {
            type: 'chai',
            label: 'Chai 1L',
            wholesalePrice: null,
            retailPrice: 52000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 12 chai',
            wholesalePrice: 530000,
            retailPrice: 620000,
            minWholesaleQty: 1,
            qtyPerUnit: 12,
          },
        ],
      },
      {
        sku: 'SP-SOY-01',
        name: 'Nước tương Maggi đậm đặc 700ml',
        description: 'Nước tương đậm đặc, chai 700ml, dùng cho nấu ăn và chấm.',
        category: 'gia-vi',
        brand: 'Maggi',
        origin: 'Việt Nam',
        unit: 'chai',
        basePrice: 24000,
        retailPrice: 35000,
        wholesalePrice: 28000,
        stock: 480,
        images: [
          'https://images.unsplash.com/photo-1635179559318-2cae4ea3c7da?w=600',
        ],
        unitTypes: [
          {
            type: 'chai',
            label: 'Chai 700ml',
            wholesalePrice: null,
            retailPrice: 35000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 12 chai',
            wholesalePrice: 336000,
            retailPrice: 410000,
            minWholesaleQty: 1,
            qtyPerUnit: 12,
          },
        ],
      },
      {
        sku: 'SP-SALT-01',
        name: 'Muối tinh i-ốt Vifon 500g',
        description: 'Muối tinh sạch i-ốt, gói 500g.',
        category: 'gia-vi',
        brand: 'Vifon',
        origin: 'Việt Nam',
        unit: 'gói',
        basePrice: 6000,
        retailPrice: 9000,
        wholesalePrice: 7000,
        stock: 1500,
        images: [
          'https://images.unsplash.com/photo-1518110925495-b37653567f54?w=600',
        ],
        unitTypes: [
          {
            type: 'gói',
            label: 'Gói 500g',
            wholesalePrice: null,
            retailPrice: 9000,
            minWholesaleQty: 0,
            qtyPerUnit: 1,
          },
          {
            type: 'thùng',
            label: 'Thùng 24 gói',
            wholesalePrice: 168000,
            retailPrice: 200000,
            minWholesaleQty: 1,
            qtyPerUnit: 24,
          },
        ],
      },
    ];

    for (const data of sampleProducts) {
      const primary =
        Array.isArray(data.images) && data.images.length > 0
          ? String(data.images[0])
          : 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800';
      const images = galleryAtLeast3(primary);

      const exists = await em.findOne(Product, { sku: data.sku! });
      if (exists) {
        // Update mutable fields so the seeder can refresh sample data without
        // requiring a fresh DB. Skips immutable fields like `sku`.
        em.assign(exists, {
          name: data.name!,
          description: data.description ?? null,
          category: data.category!,
          brand: data.brand ?? null,
          origin: data.origin ?? null,
          basePrice: data.basePrice!,
          retailPrice: data.retailPrice!,
          wholesalePrice: data.wholesalePrice!,
          stock: data.stock!,
          unit: data.unit!,
          unitTypes: data.unitTypes,
          images,
          coupons: data.coupons,
          isActive: true,
        });
        continue;
      }
      em.create(
        Product,
        { ...data, images, isActive: true },
        { partial: true },
      );
    }
  }
}
