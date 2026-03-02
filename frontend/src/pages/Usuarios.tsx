import { useEffect, useState } from 'react'
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { api } from '../api/client'

const { Title } = Typography

interface Usuario {
  id: number
  nome: string
  email: string | null
  cpf: string
  limite_emprestimos: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const loadUsuarios = async () => {
    setLoading(true)
    try {
      const data = await api.get<Usuario[]>('/usuarios')
      setUsuarios(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsuarios()
  }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload: Record<string, unknown> = {
        nome: values.nome,
        email: values.email || null,
        limite_emprestimos: values.limite_emprestimos ?? 3,
        ativo: values.ativo ?? true,
      }
      if (!editingId) {
        payload.cpf = String(values.cpf).replace(/\D/g, '').slice(0, 11)
      }
      if (editingId) {
        await api.put(`/usuarios/${editingId}`, payload)
        message.success('Usuário atualizado com sucesso')
      } else {
        await api.post('/usuarios', payload)
        message.success('Usuário cadastrado com sucesso')
      }
      setModalOpen(false)
      setEditingId(null)
      form.resetFields()
      loadUsuarios()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar'
      const errWithData = err as Error & { data?: { error?: unknown } }
      if (errWithData.data && typeof errWithData.data.error === 'object') {
        message.error('Verifique os campos do formulário')
        return
      }
      message.error(msg)
    }
  }

  const handleEdit = (record: Usuario) => {
    setEditingId(record.id)
    form.setFieldsValue({
      nome: record.nome,
      email: record.email ?? '',
      cpf: record.cpf,
      limite_emprestimos: record.limite_emprestimos,
      ativo: record.ativo,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/usuarios/${id}`)
      message.success('Usuário excluído')
      loadUsuarios()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  const handleNew = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const columns = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'E-mail', dataIndex: 'email', key: 'email', render: (v: string | null) => v || '-' },
    { title: 'CPF', dataIndex: 'cpf', key: 'cpf', width: 130 },
    { title: 'Limite', dataIndex: 'limite_emprestimos', key: 'limite_emprestimos', width: 80 },
    {
      title: 'Ativo',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 80,
      render: (v: boolean) => (v ? 'Sim' : 'Não'),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 120,
      render: (_: unknown, record: Usuario) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Editar
          </Button>
          <Popconfirm
            title="Excluir usuário?"
            description="Esta ação não pode ser desfeita."
            onConfirm={() => handleDelete(record.id)}
            okText="Excluir"
            cancelText="Cancelar"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Usuários
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
          Novo usuário
        </Button>
      </div>

      <Table
        dataSource={usuarios}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total: ${t}` }}
      />

      <Modal
        title={editingId ? 'Editar usuário' : 'Novo usuário'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false)
          setEditingId(null)
          form.resetFields()
        }}
        okText="Salvar"
        cancelText="Cancelar"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="Nome completo" />
          </Form.Item>
          <Form.Item name="email" label="E-mail">
            <Input type="email" placeholder="email@exemplo.com" />
          </Form.Item>
          <Form.Item
            name="cpf"
            label="CPF"
            rules={[
              { required: true, message: 'Obrigatório' },
              { len: 11, message: 'CPF deve ter 11 dígitos' },
            ]}
          >
            <Input placeholder="Apenas números (11 dígitos)" maxLength={11} disabled={!!editingId} />
          </Form.Item>
          <Form.Item
            name="limite_emprestimos"
            label="Limite de empréstimos"
            initialValue={3}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ativo" label="Ativo" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
