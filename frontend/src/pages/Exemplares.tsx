import { useEffect, useState } from 'react'
import {
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { api } from '../api/client'

const { Title } = Typography

interface Livro {
  id: number
  titulo: string
  autor: string | null
}

interface Exemplar {
  id: number
  livro_id: number
  codigo: string
  status: string
  livro_titulo?: string
  livro_autor?: string | null
  created_at: string
  updated_at: string
}

const STATUS_OPTIONS = [
  { value: 'DISPONIVEL', label: 'Disponível' },
  { value: 'EMPRESTADO', label: 'Emprestado' },
  { value: 'INDISPONIVEL', label: 'Indisponível' },
]

export default function Exemplares() {
  const [exemplares, setExemplares] = useState<Exemplar[]>([])
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const loadExemplares = async () => {
    setLoading(true)
    try {
      const data = await api.get<Exemplar[]>('/exemplares')
      setExemplares(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao carregar exemplares')
    } finally {
      setLoading(false)
    }
  }

  const loadLivros = async () => {
    try {
      const data = await api.get<Livro[]>('/livros')
      setLivros(data)
    } catch {
      message.error('Erro ao carregar livros')
    }
  }

  useEffect(() => {
    loadExemplares()
    loadLivros()
  }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        livro_id: values.livro_id,
        codigo: values.codigo,
        status: values.status ?? 'DISPONIVEL',
      }
      if (editingId) {
        await api.put(`/exemplares/${editingId}`, payload)
        message.success('Exemplar atualizado com sucesso')
      } else {
        await api.post('/exemplares', payload)
        message.success('Exemplar cadastrado com sucesso')
      }
      setModalOpen(false)
      setEditingId(null)
      form.resetFields()
      loadExemplares()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const handleEdit = (record: Exemplar) => {
    setEditingId(record.id)
    form.setFieldsValue({
      livro_id: record.livro_id,
      codigo: record.codigo,
      status: record.status,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/exemplares/${id}`)
      message.success('Exemplar excluído')
      loadExemplares()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  const handleNew = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const statusLabel = (s: string) => STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s

  const columns = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 120 },
    {
      title: 'Livro',
      key: 'livro',
      render: (_: unknown, r: Exemplar) =>
        r.livro_titulo ? `${r.livro_titulo}${r.livro_autor ? ` - ${r.livro_autor}` : ''}` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: string) => statusLabel(v),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 120,
      render: (_: unknown, record: Exemplar) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Editar
          </Button>
          <Popconfirm
            title="Excluir exemplar?"
            description="Empréstimos vinculados impedem a exclusão."
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
          Exemplares
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
          Novo exemplar
        </Button>
      </div>

      <Table
        dataSource={exemplares}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total: ${t}` }}
      />

      <Modal
        title={editingId ? 'Editar exemplar' : 'Novo exemplar'}
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
          <Form.Item
            name="livro_id"
            label="Livro"
            rules={[{ required: true, message: 'Obrigatório' }]}
          >
            <Select
              placeholder="Selecione o livro"
              showSearch
              optionFilterProp="label"
              options={livros.map((l) => ({
                value: l.id,
                label: `${l.titulo}${l.autor ? ` - ${l.autor}` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="codigo" label="Código" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="Código do exemplar" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="DISPONIVEL">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
