import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography } from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  BookOutlined,
  CopyOutlined,
  SwapOutlined,
  DollarOutlined,
} from '@ant-design/icons'

const { Header, Content, Sider } = Layout
const { Title } = Typography

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: 'Início' },
  { key: '/usuarios', icon: <UserOutlined />, label: 'Usuários' },
  { key: '/livros', icon: <BookOutlined />, label: 'Livros' },
  { key: '/exemplares', icon: <CopyOutlined />, label: 'Exemplares' },
  { key: '/emprestimos', icon: <SwapOutlined />, label: 'Empréstimos' },
  { key: '/multas', icon: <DollarOutlined />, label: 'Multas' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 24px',
          }}
        >
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            {collapsed ? 'B' : 'BIMU'}
          </Title>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ color: 'rgba(0,0,0,0.65)', fontSize: 14 }}>
            Biblioteca Municipal Unificada
          </span>
        </Header>
        <Content style={{ margin: '24px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
