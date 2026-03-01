import { Layout, Typography } from 'antd'

const { Header, Content } = Layout
const { Title } = Typography

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          BIMU
        </Title>
        <span style={{ color: 'rgba(255,255,255,0.65)', marginLeft: 12, fontSize: 14 }}>
          Biblioteca Municipal Unificada
        </span>
      </Header>
      <Content style={{ padding: 24 }}>
        <Title level={4}>Bem-vindo ao BIMU</Title>
        <p>
          Sistema de gerenciamento de biblioteca compartilhada entre escolas municipais.
        </p>
      </Content>
    </Layout>
  )
}

export default App
