import { useEffect, useState } from 'react'
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  Segmented,
  message,
} from 'antd'
import { PlusOutlined, CheckOutlined } from '@ant-design/icons'
import { api } from '../api/client'
import dayjs from 'dayjs'

const { Title } = Typography

interface Usuario {
  id: number
  nome: string
  cpf: string
  ativo: boolean
}

interface Exemplar {
  id: number
  codigo: string
  livro_titulo: string
  livro_autor: string | null
}

interface Emprestimo {
  id: number
  usuario_id: number
  exemplar_id: number
  data_emprestimo: string
  data_prevista_devolucao: string
  data_devolucao: string | null
  status: string
  usuario_nome: string
  usuario_cpf: string
  exemplar_codigo: string
  livro_titulo: string
  livro_autor: string | null
}

export default function Emprestimos() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [exemplaresDisponiveis, setExemplaresDisponiveis] = useState<Exemplar[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all')
  const [form] = Form.useForm()

  const loadEmprestimos = async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'all' ? '/emprestimos' : `/emprestimos?status=${statusFilter}`
      const data = await api.get<Emprestimo[]>(url)
      setEmprestimos(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao carregar empréstimos')
    } finally {
      setLoading(false)
    }
  }

  const loadUsuarios = async () => {
    try {
      const data = await api.get<Usuario[]>('/usuarios')
      setUsuarios(data.filter((u) => u.ativo))
    } catch {
      message.error('Erro ao carregar usuários')
    }
  }

  const loadExemplaresDisponiveis = async () => {
    try {
      const data = await api.get<Exemplar[]>('/exemplares?status=DISPONIVEL')
      setExemplaresDisponiveis(data)
    } catch {
      message.error('Erro ao carregar exemplares')
    }
  }

  useEffect(() => {
    loadEmprestimos()
  }, [statusFilter])

  useEffect(() => {
    loadUsuarios()
    loadExemplaresDisponiveis()
  }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        usuario_id: values.usuario_id,
        exemplar_id: values.exemplar_id,
        data_prevista_devolucao: values.data_prevista_devolucao.format('YYYY-MM-DD'),
      }
      await api.post('/emprestimos', payload)
      message.success('Empréstimo realizado com sucesso')
      setModalOpen(false)
      form.resetFields()
      loadEmprestimos()
      loadExemplaresDisponiveis()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao realizar empréstimo')
    }
  }

  const handleDevolver = async (id: number) => {
    try {
      await api.post(`/emprestimos/${id}/devolver`, {})
      message.success('Empréstimo devolvido com sucesso')
      loadEmprestimos()
      loadExemplaresDisponiveis()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao devolver')
    }
  }

  const formatDate = (d: string | null) => (d ? dayjs(d).format('DD/MM/YYYY') : '-')
  const formatDateTime = (d: string | null) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '-')

  const columns = [
    { title: 'Usuário', dataIndex: 'usuario_nome', key: 'usuario_nome' },
    { title: 'CPF', dataIndex: 'usuario_cpf', key: 'usuario_cpf', width: 120 },
    {
      title: 'Livro / Exemplar',
      key: 'livro',
      render: (_: unknown, r: Emprestimo) =>
        `${r.livro_titulo}${r.livro_autor ? ` - ${r.livro_autor}` : ''} (${r.exemplar_codigo})`,
    },
    {
      title: 'Data empréstimo',
      dataIndex: 'data_emprestimo',
      key: 'data_emprestimo',
      width: 140,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: 'Prev. devolução',
      dataIndex: 'data_prevista_devolucao',
      key: 'data_prevista_devolucao',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Devolução',
      dataIndex: 'data_devolucao',
      key: 'data_devolucao',
      width: 140,
      render: (v: string | null) => formatDateTime(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (v === 'ATIVO' ? 'Ativo' : 'Devolvido'),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 100,
      render: (_: unknown, record: Emprestimo) =>
        record.status === 'ATIVO' ? (
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleDevolver(record.id)}
          >
            Devolver
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Empréstimos
        </Title>
        <Space>
          <Segmented
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'ATIVO', label: 'Ativos' },
              { value: 'DEVOLVIDO', label: 'Devolvidos' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Novo empréstimo
          </Button>
        </Space>
      </div>

      <Table
        dataSource={emprestimos}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total: ${t}` }}
      />

      <Modal
        title="Novo empréstimo"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        okText="Realizar empréstimo"
        cancelText="Cancelar"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="usuario_id"
            label="Usuário"
            rules={[{ required: true, message: 'Obrigatório' }]}
          >
            <Select
              placeholder="Selecione o usuário"
              showSearch
              optionFilterProp="label"
              options={usuarios.map((u) => ({ value: u.id, label: `${u.nome} (${u.cpf})` }))}
            />
          </Form.Item>
          <Form.Item
            name="exemplar_id"
            label="Exemplar"
            rules={[{ required: true, message: 'Obrigatório' }]}
          >
            <Select
              placeholder="Selecione o exemplar disponível"
              showSearch
              optionFilterProp="label"
              options={exemplaresDisponiveis.map((e) => ({
                value: e.id,
                label: `${e.livro_titulo}${e.livro_autor ? ` - ${e.livro_autor}` : ''} (${e.codigo})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="data_prevista_devolucao"
            label="Data prevista de devolução"
            rules={[{ required: true, message: 'Obrigatório' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
