import { PageContainer, ProForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import { Card, Tabs, message, Upload, Button, Space, Image, Tag, Row, Col, Divider, Input, Form } from 'antd';
import { useEffect, useState } from 'react';
import { getCompanyInfo, updateCompanyInfo, uploadImage } from '@/services/companyInfo';
import { 
  UploadOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BankOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

const { TabPane } = Tabs;

const CompanyInfo: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Verileri yükle
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getCompanyInfo();
      if (response.success) {
        const data = response.data;
        setCompanyData(data);
        setLogoUrl(data.logo_url || '');
        setFaviconUrl(data.favicon_url || '');
        setCoverUrl(data.cover_image_url || '');
        
        // Array kontrolü ile güvenli set
        setGalleryPhotos(Array.isArray(data.gallery_photos) ? data.gallery_photos : []);
        setProducts(Array.isArray(data.products) ? data.products : []);
        setTeamMembers(Array.isArray(data.team_members) ? data.team_members : []);
        
        form.setFieldsValue(data);
      }
    } catch (error) {
      message.error('Veriler yüklenirken hata oluştu');
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Görsel yükleme
  const handleImageUpload = async (file: File, type: 'logo' | 'favicon' | 'cover' | 'gallery' | 'product' | 'team') => {
    try {
      message.loading({ content: 'Görsel yükleniyor...', key: 'upload' });
      const result = await uploadImage(file);
      
      if (result.image_url) {
        if (type === 'logo') {
          setLogoUrl(result.image_url);
        } else if (type === 'favicon') {
          setFaviconUrl(result.image_url);
        } else if (type === 'cover') {
          setCoverUrl(result.image_url);
        } else if (type === 'gallery') {
          setGalleryPhotos([...galleryPhotos, result.image_url]);
        }
        // product ve team için caller'da handlelanıyor
        
        message.success({ content: 'Görsel başarıyla yüklendi!', key: 'upload' });
        return result.image_url;
      } else {
        message.error({ content: 'Görsel yüklenemedi', key: 'upload' });
        return null;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      message.error({ content: 'Görsel yüklenirken hata oluştu', key: 'upload' });
      return null;
    }
  };

  // Form submit
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const submitData = {
        ...values,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        cover_image_url: coverUrl,
        gallery_photos: galleryPhotos,
        products: products,
        team_members: teamMembers,
      };

      const response = await updateCompanyInfo(submitData);
      if (response.success) {
        message.success('Kurumsal bilgiler güncellendi');
        loadData();
      }
    } catch (error) {
      message.error('Güncelleme sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Ürün ekle/düzenle
  const addProduct = () => {
    setProducts([...products, {
      id: Date.now(),
      name: '',
      description: '',
      image_url: '',
      price: 0,
      features: []
    }]);
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  // Ekip üyesi ekle/düzenle
  const addTeamMember = () => {
    setTeamMembers([...teamMembers, {
      id: Date.now(),
      name: '',
      title: '',
      photo_url: '',
      bio: '',
      email: '',
      phone: ''
    }]);
  };

  const updateTeamMember = (index: number, field: string, value: any) => {
    const newMembers = [...teamMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setTeamMembers(newMembers);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  return (
    <PageContainer
      title="🏢 Kurumsal Bilgiler"
      subTitle="Şirket bilgilerini buradan yönetin"
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Tabs defaultActiveKey="1" type="card">
          {/* TAB 1: Temel Bilgiler */}
          <TabPane tab={<span><BankOutlined /> Temel Bilgiler</span>} key="1">
            <Card>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    name="company_name"
                    label="Firma Adı"
                    rules={[{ required: true, message: 'Firma adı zorunludur' }]}
                  >
                    <Input size="large" placeholder="Örn: ABC Teknoloji A.Ş." />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="company_slogan" label="Slogan">
                    <Input placeholder="Örn: İnovasyonun Adresi" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="company_description" label="Firma Açıklaması">
                    <Input.TextArea rows={4} placeholder="Firma hakkında detaylı açıklama..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="mission" label="Misyon">
                    <Input.TextArea rows={3} placeholder="Misyonumuz..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="vision" label="Vizyon">
                    <Input.TextArea rows={3} placeholder="Vizyonumuz..." />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          {/* TAB 2: Görsel ve Logo */}
          <TabPane tab={<span><UploadOutlined /> Görseller</span>} key="2">
            <Card>
              <Row gutter={[24, 24]}>
                <Col span={8}>
                  <div>
                    <h3>Logo</h3>
                    {logoUrl && <Image src={logoUrl} alt="Logo" style={{ maxWidth: '200px', marginBottom: 16 }} />}
                    <Upload
                      showUploadList={false}
                      beforeUpload={async (file) => {
                        await handleImageUpload(file, 'logo');
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Logo Yükle</Button>
                    </Upload>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <h3>Favicon</h3>
                    {faviconUrl && <Image src={faviconUrl} alt="Favicon" style={{ maxWidth: '100px', marginBottom: 16 }} />}
                    <Upload
                      showUploadList={false}
                      beforeUpload={async (file) => {
                        await handleImageUpload(file, 'favicon');
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Favicon Yükle</Button>
                    </Upload>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <h3>Kapak Görseli</h3>
                    {coverUrl && <Image src={coverUrl} alt="Cover" style={{ maxWidth: '200px', marginBottom: 16 }} />}
                    <Upload
                      showUploadList={false}
                      beforeUpload={async (file) => {
                        await handleImageUpload(file, 'cover');
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Kapak Yükle</Button>
                    </Upload>
                  </div>
                </Col>
                <Col span={24}>
                  <Divider>Fotoğraf Galerisi</Divider>
                  <Space wrap>
                    {Array.isArray(galleryPhotos) && galleryPhotos.map((photo, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <Image src={photo} alt={`Gallery ${index}`} width={150} height={150} style={{ objectFit: 'cover' }} />
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => setGalleryPhotos(galleryPhotos.filter((_, i) => i !== index))}
                          style={{ position: 'absolute', top: 5, right: 5 }}
                        />
                      </div>
                    ))}
                    <Upload
                      showUploadList={false}
                      beforeUpload={async (file) => {
                        await handleImageUpload(file, 'gallery');
                        return false;
                      }}
                    >
                      <div style={{ width: 150, height: 150, border: '2px dashed #d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <PlusOutlined style={{ fontSize: 32, color: '#999' }} />
                      </div>
                    </Upload>
                  </Space>
                </Col>
              </Row>
            </Card>
          </TabPane>

          {/* TAB 3: İletişim Bilgileri */}
          <TabPane tab={<span><PhoneOutlined /> İletişim</span>} key="3">
            <Card>
              <Row gutter={[16, 16]}>
                <Col span={24}><h3><EnvironmentOutlined /> Adres Bilgileri</h3></Col>
                <Col span={12}>
                  <Form.Item name="address_line1" label="Adres Satırı 1">
                    <Input placeholder="Cadde, sokak, numara..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="address_line2" label="Adres Satırı 2">
                    <Input placeholder="İlave adres bilgisi..." />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="city" label="Şehir">
                    <Input placeholder="İstanbul" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="state_province" label="İlçe">
                    <Input placeholder="Kadıköy" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="postal_code" label="Posta Kodu">
                    <Input placeholder="34000" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="country" label="Ülke">
                    <Input placeholder="Türkiye" />
                  </Form.Item>
                </Col>

                <Col span={24}><Divider /></Col>
                <Col span={24}><h3><PhoneOutlined /> Telefon ve Email</h3></Col>
                
                <Col span={8}>
                  <Form.Item name="phone_primary" label="Ana Telefon">
                    <Input placeholder="+90 555 123 4567" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="phone_secondary" label="İkinci Telefon">
                    <Input placeholder="+90 555 987 6543" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="whatsapp_number" label="WhatsApp Hattı">
                    <Input placeholder="+90 555 123 4567" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="email_general" label="Genel Email">
                    <Input placeholder="info@example.com" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="email_support" label="Destek Email">
                    <Input placeholder="destek@example.com" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="email_sales" label="Satış Email">
                    <Input placeholder="satis@example.com" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          {/* TAB 4: Web ve Sosyal Medya */}
          <TabPane tab={<span><GlobalOutlined /> Web & Sosyal Medya</span>} key="4">
            <Card>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item name="website_url" label="Website">
                    <Input prefix={<GlobalOutlined />} placeholder="https://www.example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="facebook_url" label="Facebook">
                    <Input placeholder="https://facebook.com/..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="twitter_url" label="Twitter/X">
                    <Input placeholder="https://twitter.com/..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="instagram_url" label="Instagram">
                    <Input placeholder="https://instagram.com/..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="linkedin_url" label="LinkedIn">
                    <Input placeholder="https://linkedin.com/company/..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="youtube_url" label="YouTube">
                    <Input placeholder="https://youtube.com/@..." />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>

          {/* TAB 5: Ürünler/Hizmetler */}
          <TabPane tab={<span><ShoppingOutlined /> Ürünler/Hizmetler</span>} key="5">
            <Card>
              <Button type="dashed" onClick={addProduct} icon={<PlusOutlined />} style={{ marginBottom: 16 }} block>
                Ürün/Hizmet Ekle
              </Button>
              
              {Array.isArray(products) && products.map((product, index) => (
                <Card 
                  key={product.id} 
                  size="small" 
                  style={{ marginBottom: 16 }}
                  title={`Ürün ${index + 1}`}
                  extra={<Button danger size="small" icon={<DeleteOutlined />} onClick={() => removeProduct(index)}>Sil</Button>}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Input 
                        placeholder="Ürün Adı" 
                        value={product.name}
                        onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      />
                    </Col>
                    <Col span={12}>
                      <Input 
                        placeholder="Fiyat" 
                        type="number"
                        value={product.price}
                        onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value))}
                      />
                    </Col>
                    <Col span={24}>
                      <Input.TextArea 
                        placeholder="Açıklama" 
                        rows={2}
                        value={product.description}
                        onChange={(e) => updateProduct(index, 'description', e.target.value)}
                      />
                    </Col>
                    <Col span={24}>
                      {product.image_url && <Image src={product.image_url} alt="Product" width={100} style={{ marginBottom: 8 }} />}
                      <Upload
                        showUploadList={false}
                        beforeUpload={async (file) => {
                          const url = await handleImageUpload(file, 'product');
                          if (url) updateProduct(index, 'image_url', url);
                          return false;
                        }}
                      >
                        <Button size="small" icon={<UploadOutlined />}>Ürün Görseli</Button>
                      </Upload>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Card>
          </TabPane>

          {/* TAB 6: Ekip Üyeleri */}
          <TabPane tab={<span><TeamOutlined /> Ekip</span>} key="6">
            <Card>
              <Button type="dashed" onClick={addTeamMember} icon={<PlusOutlined />} style={{ marginBottom: 16 }} block>
                Ekip Üyesi Ekle
              </Button>
              
              <Row gutter={[16, 16]}>
                {Array.isArray(teamMembers) && teamMembers.map((member, index) => (
                  <Col span={8} key={member.id}>
                    <Card 
                      size="small"
                      cover={member.photo_url && <Image src={member.photo_url} alt={member.name} height={200} style={{ objectFit: 'cover' }} />}
                      actions={[
                        <Upload
                          showUploadList={false}
                          beforeUpload={async (file) => {
                            const url = await handleImageUpload(file, 'team');
                            if (url) updateTeamMember(index, 'photo_url', url);
                            return false;
                          }}
                        >
                          <UploadOutlined key="upload" /> Fotoğraf
                        </Upload>,
                        <DeleteOutlined key="delete" onClick={() => removeTeamMember(index)} />
                      ]}
                    >
                      <Input 
                        placeholder="Ad Soyad" 
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                        style={{ marginBottom: 8 }}
                      />
                      <Input 
                        placeholder="Pozisyon" 
                        value={member.title}
                        onChange={(e) => updateTeamMember(index, 'title', e.target.value)}
                        style={{ marginBottom: 8 }}
                      />
                      <Input 
                        placeholder="Email" 
                        value={member.email}
                        onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                        style={{ marginBottom: 8 }}
                      />
                      <Input 
                        placeholder="Telefon" 
                        value={member.phone}
                        onChange={(e) => updateTeamMember(index, 'phone', e.target.value)}
                        style={{ marginBottom: 8 }}
                      />
                      <Input.TextArea 
                        placeholder="Kısa Biyografi" 
                        rows={2}
                        value={member.bio}
                        onChange={(e) => updateTeamMember(index, 'bio', e.target.value)}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </TabPane>

          {/* TAB 7: Yasal Bilgiler */}
          <TabPane tab={<span><SafetyOutlined /> Yasal Bilgiler</span>} key="7">
            <Card>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item name="legal_name" label="Yasal Ünvan">
                    <Input placeholder="ABC Teknoloji A.Ş." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="tax_number" label="Vergi Numarası">
                    <Input placeholder="1234567890" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="trade_registry_number" label="Ticaret Sicil No">
                    <Input placeholder="12345/6789" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="default_currency" label="Para Birimi">
                    <Input placeholder="TRY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="default_language" label="Varsayılan Dil">
                    <Input placeholder="tr" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="timezone" label="Zaman Dilimi">
                    <Input placeholder="Europe/Istanbul" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </TabPane>
        </Tabs>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" htmlType="submit" size="large" loading={loading}>
            💾 Değişiklikleri Kaydet
          </Button>
        </div>
      </Form>
    </PageContainer>
  );
};

export default CompanyInfo;

