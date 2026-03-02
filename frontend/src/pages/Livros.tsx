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
  isbn: string | null
  editora: string | null
  ano_publicacao: number | null
  created_at: string
  updated_at: string
}

export default function Livros() {
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const loadLivros = async () => {
    setLoading(true)
    try {
      const data = await api.get<Livro[]>('/livros')
      setLivros(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao carregar livros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLivros()
  }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        titulo: values.titulo,
        autor: values.autor || null,
        isbn: values.isbn || null,
        editora: values.editora || null,
        ano_publicacao: values.ano_publicacao ? Number(values.ano_publicacao) : null,
      }
      if (editingId) {
        await api.put(`/livros/${editingId}`, payload)
        message.success('Livro atualizado com sucesso')
      } else {
        await api.post('/livros', payload)
        message.success('Livro cadastrado com sucesso')
      }
      setModalOpen(false)
      setEditingId(null)
      form.resetFields()
      loadLivros()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const handleEdit = (record: Livro) => {
    setEditingId(record.id)
    form.setFieldsValue({
      titulo: record.titulo,
      autor: record.autor ?? '',
      isbn: record.isbn ?? '',
      editora: record.editora ?? '',
      ano_publicacao: record.ano_publicacao ?? undefined,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/livros/${id}`)
      message.success('Livro excluído')
      loadLivros()
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
    { title: 'Título', dataIndex: 'titulo', key: 'titulo', ellipsis: true },
    { title: 'Autor', dataIndex: 'autor', key: 'autor', render: (v: string | null) => v || '-' },
    { title: 'ISBN', dataIndex: 'isbn', key: 'isbn', width: 130, render: (v: string | null) => v || '-' },
    { title: 'Editora', dataIndex: 'editora', key: 'editora', render: (v: string | null) => v || '-' },
    {
      title: 'Ano',
      dataIndex: 'ano_publicacao',
      key: 'ano_publicacao',
      width: 80,
      render: (v: number | null) => v ?? '-',
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 120,
      render: (_: unknown, record: Livro) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Editar
          </Button>
          <Popconfirm
            title="Excluir livro?"
            description="Exemplares vinculados impedem a exclusão."
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
          Livros
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
          Novo livro
        </Button>
      </div>

      <Table
        dataSource={livros}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total: ${t}` }}
      />

      <Modal
        title={editingId ? 'Editar livro' : 'Novo livro'}
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
          <Form.Item name="titulo" label="Título" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="Título do livro" />
          </Form.Item>
          <Form.Item name="autor" label="Autor">
            <Input placeholder="Nome do autor" />
          </Form.Item>
          <Form.Item name="isbn" label="ISBN">
            <Input placeholder="ISBN" />
          </Form.Item>
          <Form.Item name="editora" label="Editora">
            <Input placeholder="Editora" />
          </Form.Item>
          <Form.Item name="ano_publicacao" label="Ano de publicação">
            <InputNumber min={1000} max={2100} style={{ width: '100%' }} placeholder="Ex: 2020" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
