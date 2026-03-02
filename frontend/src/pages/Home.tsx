  import { Typography } from 'antd'

const { Title } = Typography

export default function Home() {
  return (
    <>
      <Title level={4}>Bem-vindo ao BIMU</Title>
      <p>
        Sistema de gerenciamento de biblioteca compartilhada entre escolas municipais.
      </p>
    </>
  )
}
