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
  },
  {
    path: '/contacts',
    name: 'contacts',
    icon: 'team',
    component: './Contacts',
  },
  {
    path: '/templates',
    name: 'templates',
    icon: 'mail',
    component: './Templates',
  },
  {
    path: '/campaigns',
    name: 'campaigns',
    icon: 'send',
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
  },
  {
    path: '/scheduler-logs',
    name: 'scheduler-logs',
    icon: 'code',
    component: './SchedulerLogs',
    hideInMenu: true,
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'setting',
    access: 'canSuperAdmin',
    routes: [
      {
        path: '/admin',
        redirect: '/admin/organizations',
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
    ],
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
