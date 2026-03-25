/**
 * Sequelize 数据模型
 */
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');

// 创建 Sequelize 实例
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: config.isDev ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 定义模型

// 论文模型
const Paper = sequelize.define('Paper', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  authors: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  abstract: {
    type: DataTypes.TEXT
  },
  source: {
    type: DataTypes.STRING(200)
  },
  publishDate: {
    type: DataTypes.DATEONLY
  },
  updateDate: {
    type: DataTypes.DATEONLY
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  subcategory: {
    type: DataTypes.STRING(100)
  },
  url: {
    type: DataTypes.STRING(500)
  },
  pdfUrl: {
    type: DataTypes.STRING(500)
  },
  citations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'papers',
  timestamps: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['subcategory'] },
    { fields: ['publishDate'] },
    { fields: ['citations'] }
  ]
});

// 标签模型
const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING(50)
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'tags'
});

// 用户模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING(200)
  },
  avatarUrl: {
    type: DataTypes.STRING(500)
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'user'
  },
  lastLogin: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users'
});

// 收藏模型
const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  }
}, {
  tableName: 'favorites',
  indexes: [
    { fields: ['userId', 'paperId'], unique: true }
  ]
});

// 阅读清单模型
const ReadingList = sequelize.define('ReadingList', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'unread',
    validate: {
      isIn: [['unread', 'reading', 'completed']]
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'reading_list',
  indexes: [
    { fields: ['userId', 'paperId'], unique: true }
  ]
});

// 订阅模型
const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  target: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  notifyEmail: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notifyWeb: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'subscriptions',
  indexes: [
    { fields: ['userId', 'type', 'target'], unique: true }
  ]
});

// 每日推送记录
const DailyPush = sequelize.define('DailyPush', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  pushDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true
  },
  papers: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'daily_pushes'
});

// 定义关联关系

// Paper - Tag 多对多
Paper.belongsToMany(Tag, { through: 'PaperTags' });
Tag.belongsToMany(Paper, { through: 'PaperTags' });

// User - Paper 收藏
User.belongsToMany(Paper, { through: Favorite, as: 'favorites' });
Paper.belongsToMany(User, { through: Favorite, as: 'favoritedBy' });

// User - Paper 阅读清单
User.belongsToMany(Paper, { through: ReadingList, as: 'readingList' });
Paper.belongsToMany(User, { through: ReadingList, as: 'readers' });

// User - Subscription
User.hasMany(Subscription, { foreignKey: 'userId' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

// 导出
module.exports = {
  sequelize,
  Paper,
  Tag,
  User,
  Favorite,
  ReadingList,
  Subscription,
  DailyPush
};
