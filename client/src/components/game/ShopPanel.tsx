import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { useResources } from "@/lib/stores/useResources";
import { useDogs } from "@/lib/stores/useDogs";
import { ShopItemType, CurrencyType, Rarity } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShopItem {
  id: number;
  itemType: ShopItemType;
  name: string;
  description: string;
  price: number;
  currencyType: CurrencyType;
  rarity?: Rarity;
  boost?: Record<string, number>;
  available: boolean;
}

const ShopPanel = () => {
  const { plk, lor, gems, fetchResources, updateResources } = useResources();
  const { fetchDogs } = useDogs();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  
  useEffect(() => {
    fetchShopItems();
  }, []);
  
  const fetchShopItems = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/shop");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching shop items:", error);
      toast.error("Failed to load shop items");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePurchase = async () => {
    if (!selectedItem) return;
    
    try {
      const response = await apiRequest("POST", "/api/shop/purchase", {
        itemId: selectedItem.id,
        quantity: purchaseQuantity
      });
      
      const data = await response.json();
      
      // Update resources
      fetchResources();
      
      // If it's a dog, refresh dogs
      if (selectedItem.itemType === ShopItemType.DOG) {
        fetchDogs();
      }
      
      toast.success(`Successfully purchased ${purchaseQuantity > 1 ? `${purchaseQuantity}x ` : ''}${selectedItem.name}!`);
      setPurchaseDialogOpen(false);
      setPurchaseQuantity(1);
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast.error("Failed to purchase item. Make sure you have enough resources.");
    }
  };
  
  const openPurchaseDialog = (item: ShopItem) => {
    setSelectedItem(item);
    setPurchaseDialogOpen(true);
    setPurchaseQuantity(1);
  };
  
  const getAffordabilityStatus = (item: ShopItem) => {
    switch (item.currencyType) {
      case CurrencyType.PLK:
        return plk >= item.price;
      case CurrencyType.LOR:
        return lor >= item.price;
      case CurrencyType.GEMS:
        return gems >= item.price;
      default:
        return false;
    }
  };
  
  const getCurrencyIcon = (currencyType: CurrencyType) => {
    switch (currencyType) {
      case CurrencyType.PLK:
        return <i className="fas fa-drumstick-bite text-amber-500 mr-1"></i>;
      case CurrencyType.LOR:
        return <i className="fas fa-coins text-yellow-500 mr-1"></i>;
      case CurrencyType.GEMS:
        return <i className="fas fa-gem text-purple-500 mr-1"></i>;
      default:
        return null;
    }
  };
  
  const getRarityColor = (rarity?: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON:
        return "bg-gray-200 text-gray-800";
      case Rarity.RARE:
        return "bg-blue-200 text-blue-800";
      case Rarity.LEGENDARY:
        return "bg-purple-200 text-purple-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };
  
  const getItemTypeIcon = (itemType: ShopItemType) => {
    switch (itemType) {
      case ShopItemType.DOG:
        return <i className="fas fa-dog mr-2"></i>;
      case ShopItemType.BOOSTER:
        return <i className="fas fa-bolt mr-2"></i>;
      case ShopItemType.CURRENCY:
        return <i className="fas fa-dollar-sign mr-2"></i>;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="shop-loading">
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-4xl mb-4 text-primary"></i>
          <p>Loading shop items...</p>
        </div>
      </div>
    );
  }
  
  // Group items by type
  const dogItems = items.filter(item => item.itemType === ShopItemType.DOG && item.available);
  const boosterItems = items.filter(item => item.itemType === ShopItemType.BOOSTER && item.available);
  const currencyItems = items.filter(item => item.itemType === ShopItemType.CURRENCY && item.available);
  
  return (
    <div className="shop-container">
      <div className="shop-header mb-4">
        <h3 className="text-lg font-bold">Princess Ayana's Royal Shop</h3>
        <div className="shop-resources flex gap-4 text-sm">
          <div className="resource">
            <i className="fas fa-drumstick-bite text-amber-500 mr-1"></i> {plk} PLK
          </div>
          <div className="resource">
            <i className="fas fa-coins text-yellow-500 mr-1"></i> {lor} Lor
          </div>
          <div className="resource">
            <i className="fas fa-gem text-purple-500 mr-1"></i> {gems} Gems
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="dogs">
        <TabsList className="mb-4">
          <TabsTrigger value="dogs">
            <i className="fas fa-dog mr-2"></i> Dogs
          </TabsTrigger>
          <TabsTrigger value="boosters">
            <i className="fas fa-bolt mr-2"></i> Boosters
          </TabsTrigger>
          <TabsTrigger value="currencies">
            <i className="fas fa-dollar-sign mr-2"></i> Resources
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dogs">
          {dogItems.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <i className="fas fa-dog text-4xl text-muted-foreground mb-3"></i>
                <h3 className="mb-2">No Dogs Available</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for special dog breeds!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dogItems.map((item) => {
                const isAffordable = getAffordabilityStatus(item);
                return (
                  <Card key={item.id} className={`shop-item ${isAffordable ? '' : 'unaffordable'}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        {item.rarity && (
                          <Badge className={getRarityColor(item.rarity)}>
                            {item.rarity}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-2 pt-0">
                      {item.boost && (
                        <div className="item-stats text-xs grid grid-cols-2 gap-1 mb-2">
                          {Object.entries(item.boost).map(([stat, value]) => (
                            <div key={stat} className="stat-boost">
                              {stat.charAt(0).toUpperCase() + stat.slice(1)}: +{value}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button 
                        className="w-full"
                        disabled={!isAffordable}
                        onClick={() => openPurchaseDialog(item)}
                      >
                        {getCurrencyIcon(item.currencyType)}
                        {item.price} {item.currencyType}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="boosters">
          {boosterItems.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <i className="fas fa-bolt text-4xl text-muted-foreground mb-3"></i>
                <h3 className="mb-2">No Boosters Available</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for special boosters!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boosterItems.map((item) => {
                const isAffordable = getAffordabilityStatus(item);
                return (
                  <Card key={item.id} className={`shop-item ${isAffordable ? '' : 'unaffordable'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-2 pt-0">
                      {item.boost && (
                        <div className="item-stats text-xs grid grid-cols-2 gap-1 mb-2">
                          {Object.entries(item.boost).map(([stat, value]) => (
                            <div key={stat} className="stat-boost">
                              {stat.charAt(0).toUpperCase() + stat.slice(1)}: +{value}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button 
                        className="w-full"
                        disabled={!isAffordable}
                        onClick={() => openPurchaseDialog(item)}
                      >
                        {getCurrencyIcon(item.currencyType)}
                        {item.price} {item.currencyType}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="currencies">
          {currencyItems.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <i className="fas fa-dollar-sign text-4xl text-muted-foreground mb-3"></i>
                <h3 className="mb-2">No Resource Packs Available</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for special resource packs!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currencyItems.map((item) => {
                const isAffordable = getAffordabilityStatus(item);
                return (
                  <Card key={item.id} className={`shop-item ${isAffordable ? '' : 'unaffordable'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    
                    <CardFooter>
                      <Button 
                        className="w-full"
                        disabled={!isAffordable}
                        onClick={() => openPurchaseDialog(item)}
                      >
                        {getCurrencyIcon(item.currencyType)}
                        {item.price} {item.currencyType}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              {selectedItem?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedItem?.itemType !== ShopItemType.DOG && (
              <div className="quantity-selector mb-4">
                <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                  Quantity
                </label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                  >
                    <i className="fas fa-minus"></i>
                  </Button>
                  <div className="quantity-display mx-4 text-center w-12">
                    {purchaseQuantity}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                  >
                    <i className="fas fa-plus"></i>
                  </Button>
                </div>
              </div>
            )}
            
            <div className="purchase-details">
              <div className="flex justify-between items-center mb-2">
                <span>Item:</span>
                <span className="font-medium">{selectedItem?.name}</span>
              </div>
              
              {selectedItem?.itemType !== ShopItemType.DOG && (
                <div className="flex justify-between items-center mb-2">
                  <span>Quantity:</span>
                  <span>{purchaseQuantity}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-2">
                <span>Price:</span>
                <span className="font-medium">
                  {getCurrencyIcon(selectedItem?.currencyType as CurrencyType)}
                  {selectedItem?.price} {selectedItem?.currencyType} 
                  {purchaseQuantity > 1 && ` x ${purchaseQuantity} = ${(selectedItem?.price || 0) * purchaseQuantity}`}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Your balance:</span>
                <span>
                  {getCurrencyIcon(selectedItem?.currencyType as CurrencyType)}
                  {selectedItem?.currencyType === CurrencyType.PLK ? plk :
                   selectedItem?.currencyType === CurrencyType.LOR ? lor : gems}
                </span>
              </div>
              
              {selectedItem && purchaseQuantity > 0 && (
                <div className="mt-4">
                  {((selectedItem.currencyType === CurrencyType.PLK && plk < selectedItem.price * purchaseQuantity) ||
                    (selectedItem.currencyType === CurrencyType.LOR && lor < selectedItem.price * purchaseQuantity) ||
                    (selectedItem.currencyType === CurrencyType.GEMS && gems < selectedItem.price * purchaseQuantity)) ? (
                    <p className="text-sm text-destructive">
                      You don't have enough {selectedItem.currencyType} to make this purchase.
                    </p>
                  ) : (
                    <p className="text-sm text-green-600">
                      You have enough {selectedItem.currencyType} to make this purchase.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={!selectedItem || 
                (selectedItem.currencyType === CurrencyType.PLK && plk < selectedItem.price * purchaseQuantity) ||
                (selectedItem.currencyType === CurrencyType.LOR && lor < selectedItem.price * purchaseQuantity) ||
                (selectedItem.currencyType === CurrencyType.GEMS && gems < selectedItem.price * purchaseQuantity)}
            >
              Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopPanel;
