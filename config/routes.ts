export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    component: './Dashboard',
    access: 'canNotSuperAdmin',
  },
  {
    path: '/contacts',
    name: 'contacts',
    icon: 'team',
    component: './Contacts',
    access: 'canNotSuperAdmin',
  },
  {
    path: '/templates',
    name: 'templates',
    icon: 'mail',
    component: './Templates',
    access: 'canNotSuperAdmin',
  },
  {
    path: '/campaigns',
    name: 'campaigns',
    icon: 'send',
    access: 'canNotSuperAdmin',
    routes: [
      {
        path: '/campaigns',
        redirect: '/campaigns/list',
      },
      {
        path: '/campaigns/list',
        name: 'list',
        component: './Campaigns',
      },
      {
        path: '/campaigns/create',
        name: 'create',
        component: './Campaigns/CreateNew',
      },
      {
        path: '/campaigns/edit/:id',
        name: 'edit',
        component: './Campaigns/CreateNew',
        hideInMenu: true,
      },
      {
        path: '/campaigns/create-old',
        name: 'create-old',
        component: './Campaigns/Create',
        hideInMenu: true,
      },
    ],
  },
  {
    path: '/company-info',
    name: 'company-info',
    icon: 'bank',
    component: './CompanyInfo',
    access: 'canNotSuperAdmin',
  },
  {
    path: '/special-days',
    name: 'special-days',
    icon: 'calendar',
    component: './SpecialDays',
    access: 'canNotSuperAdmin',
  },
  {
    path: '/scheduler-logs',
    name: 'scheduler-logs',
    icon: 'code',
    component: './SchedulerLogs',
    hideInMenu: true,
  },
  // Super Admin yönetim paneli
  {
    path: '/admin',
    name: 'admin',
    icon: 'setting',
    access: 'canSuperAdmin',
    routes: [
      {
        path: '/admin',
        redirect: '/admin/dashboard',
      },
      {
        path: '/admin/dashboard',
        name: 'dashboard',
        icon: 'dashboard',
        component: './Dashboard',
      },
      {
        path: '/admin/organizations',
        name: 'organizations',
        component: './Admin/Organizations',
      },
      {
        path: '/admin/users',
        name: 'users',
        component: './Admin/Users',
      },
      {
        path: '/admin/backup',
        name: 'backup',
        icon: 'database',
        component: './Admin/Backup',
      },
    ],
  },
  // Org Admin yönetim paneli
  {
    path: '/organization',
    name: 'organization',
    icon: 'team',
    access: 'canOrgAdmin',
    routes: [
      {
        path: '/organization',
        redirect: '/organization/users',
      },
      {
        path: '/organization/users',
        name: 'users',
        component: './Organization/Users',
      },
      {
        path: '/organization/limits',
        name: 'limits',
        component: './Organization/Limits',
      },
    ],
  },
  {
    path: '/403',
    component: './403',
    hideInMenu: true,
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '*',
    component: './404',
  },
];
