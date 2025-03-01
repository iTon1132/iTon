﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection;
using System.Threading;
using GTANetworkAPI;
using MySqlConnector;
using NeptuneEvo.Core;
using Redage.SDK;
using NeptuneEvo.GUI;
using NeptuneEvo.Core.nAccount;
using NeptuneEvo.Core.Character;

namespace NeptuneEvo.MoneySystem
{
    class Donations : Script
    {
        public static Queue<KeyValuePair<string, string>> toChange = new Queue<KeyValuePair<string, string>>();
        public static Queue<string> newNames = new Queue<string>();
        private static DateTime lastCheck = DateTime.Now;
        private static nLog Log = new nLog("Donations");
        private static Timer scanTimer;

        private static Config config = new Config("Donations");
        
        private static string SYNCSTR;
        private static string CHNGSTR;
        private static string NEWNSTR;

        private static string Connection;

        public static void LoadDonations()
        {
            Connection =
                $"Host={config.TryGet<string>("Host", "185.71.65.109")};" +
                $"User={config.TryGet<string>("User", "donations")};" +
                $"Password={config.TryGet<string>("Password", "Z6NfNpQyEcyFECB7")};" +
                $"Database={config.TryGet<string>("Database", "payments")};" +
                $"{config.TryGet<string>("SSL", "SslMode=None;")}";

            SYNCSTR = string.Format("select * from completed where srv={0}", Main.oldconfig.ServerNumber);
            CHNGSTR = "update nicknames SET name='{0}' WHERE name='{1}' and srv={2}";
            NEWNSTR = "insert into nicknames(srv, name) VALUES ({0}, '{1}')";
        }
        #region Работа с таймером
        public static void Start()
        {
            scanTimer = new Timer(new TimerCallback(Tick), null, 90000, 90000);
        }

        public static void Stop()
        {
            scanTimer.Change(Timeout.Infinite, 0);
        }
        #endregion

        #region Проверка никнеймов и донатов
        private static void Tick(object state)
        {
            try
            {
                Log.Debug("Donate time");

                using (MySqlConnection connection = new MySqlConnection(Connection))
                {
                    connection.Open();

                    MySqlCommand command = new MySqlCommand();
                    command.Connection = connection;

                    while (toChange.Count > 0)
                    {
                        KeyValuePair<string, string> kvp = toChange.Dequeue();
                        command.CommandText = string.Format(CHNGSTR, kvp.Value, kvp.Key, Main.oldconfig.ServerNumber);
                        command.ExecuteNonQuery();
                    }

                    while (newNames.Count > 0)
                    {
                        string nickname = newNames.Dequeue();
                        command.CommandText = string.Format(NEWNSTR, Main.oldconfig.ServerNumber, nickname);
                        command.ExecuteNonQuery();
                    }

                    command.CommandText = SYNCSTR;
                    MySqlDataReader reader = command.ExecuteReader();

                    DataTable result = new DataTable();
                    result.Load(reader);
                    reader.Close();

                    foreach (DataRow Row in result.Rows)
                    {
                        int id = Convert.ToInt32(Row["id"]);
                        string name = Convert.ToString(Row["account"]).ToLower();
                        long reds = Convert.ToInt64(Row["amount"]);

                        try
                        {
                            if (Main.oldconfig.DonateSaleEnable)
                            {
                                reds = SaleEvent(reds);
                            }

                            if (!Main.Usernames.Contains(name))
                            {
                                Log.Write($"Can't find registred name for {name}!", nLog.Type.Warn);
                                continue;
                            }

                            var client = Main.Accounts.FirstOrDefault(a => a.Value.Login == name).Key;
                            if (client == null || client.IsNull || !Main.Accounts.ContainsKey(client))
                            {
                                MySQL.Query($"update `accounts` set `redbucks`=`redbucks`+{reds} where `login`='{name}'");
                            }
                            else
                            {
                                lock (Main.Players)
                                {
                                    Main.Accounts[client].RedBucks += reds;
                                }
                                NAPI.Task.Run(() =>
                                {
                                    try
                                    {
                                        if (!Main.Accounts.ContainsKey(client)) return;
                                        Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, $"Вам пришли {reds} Redbucks", 3000);
                                        Trigger.ClientEvent(client, "starset", Main.Accounts[client].RedBucks);
                                    }
                                    catch { }
                                });
                            }
                            //TODO: новый лог денег
                            //GameLog.Money("donate", $"player({Main.PlayerUUIDs[name]})", +stars);
                            GameLog.Money("server", name, reds, "donateRed");

                            command.CommandText = $"delete from completed where id={id}";
                            command.ExecuteNonQuery();
                        }
                        catch (Exception e)
                        {
                            Log.Write($"Exception At Tick_Donations on {name}:\n" + e.ToString(), nLog.Type.Error);
                        }
                    }
                    connection.Close();
                }
            }
            catch(Exception e)
            {
                Log.Write("Exception At Tick_Donations:\n" + e.ToString(), nLog.Type.Error);
            }
        }
        #endregion

        #region Действия в донат-меню
        internal enum Type
        {
            Character,
            Nickname,
            Convert,
            BronzeVIP,
            SilverVIP,
            GoldVIP,
            PlatinumVIP,
            Warn,
            Slot,
            GiveBox,
            WheelsRun,//10
            Money1,//11
            Money2,//12
            Money3,//13
            Money4,//14
            Box1,//15
            Box2,//16
            Box3,//17
            Box4,//18
            Lic1,//19
            Lic2,//20
        }

        private static SortedList<int, string> CarName = new SortedList<int, string>
        {
            {3, "g65" },
            {4, "c63coupe" },
            {5, "apriora" },
            {6, "bmwe34" },

        };
        private static SortedList<int, string> CarNameS = new SortedList<int, string>
        {
            {1, "Neon" },
            {2, "Sultan" },
            {3, "nero" },
            {4, "caracara2" },

        };

        [RemoteEvent("wheelAddsrv")]
        public void wheelAdd(Player client, int id, bool add)
        {
            if (!Main.Accounts.ContainsKey(client)) return;
            switch (id)
            {
                case 0:
                    MoneySystem.Wallet.Change(client, 50000);
                    Log.Write("Деньги пришли в размере 50 000", nLog.Type.Success);
                    break;
                case 1:
                    MoneySystem.Wallet.Change(client, 100000);
                    Log.Write("Деньги пришли в размере 100 000", nLog.Type.Success);
                    break;
                case 2:
                    MoneySystem.Wallet.Change(client, 150000);
                    Log.Write("Деньги пришли в размере 150 000", nLog.Type.Success);
                    break;
                case 3:
                    if (add)
                    {
                        var vNumber = VehicleManager.Create(client.Name, CarName[id], new Color(0, 0, 0), new Color(0, 0, 0), new Color(0, 0, 0));
                        var house = Houses.HouseManager.GetHouse(client, false);
                        if (house != null)
                        {
                            if (house.GarageID != 0)
                            {
                                var garage = Houses.GarageManager.Garages[house.GarageID];
                                if (VehicleManager.getAllPlayerVehicles(client.Name).Count < Houses.GarageManager.GarageTypes[garage.Type].MaxCars)
                                {
                                    garage.SpawnCar(vNumber);
                                    Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, $"", 3000);
                                }
                            }
                        }
                    }
                    break;
                case 4:
                    if (add)
                    {
                        var vNumber = VehicleManager.Create(client.Name, CarName[id], new Color(0, 0, 0), new Color(0, 0, 0), new Color(0, 0, 0));
                        var house = Houses.HouseManager.GetHouse(client, false);
                        if (house != null)
                        {
                            if (house.GarageID != 0)
                            {
                                var garage = Houses.GarageManager.Garages[house.GarageID];
                                if (VehicleManager.getAllPlayerVehicles(client.Name).Count < Houses.GarageManager.GarageTypes[garage.Type].MaxCars)
                                {
                                    garage.SpawnCar(vNumber);
                                    Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, $"", 3000);
                                }
                            }
                        }
                    }
                    break;
                case 5:
                    if (add)
                    {
                        var vNumber = VehicleManager.Create(client.Name, CarName[id], new Color(0, 0, 0), new Color(0, 0, 0), new Color(0, 0, 0));
                        var house = Houses.HouseManager.GetHouse(client, false);
                        if (house != null)
                        {
                            if (house.GarageID != 0)
                            {
                                var garage = Houses.GarageManager.Garages[house.GarageID];
                                if (VehicleManager.getAllPlayerVehicles(client.Name).Count < Houses.GarageManager.GarageTypes[garage.Type].MaxCars)
                                {
                                    garage.SpawnCar(vNumber);
                                    Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, $"", 3000);
                                }
                            }
                        }
                    }
                    break;
                case 6:
                    if (add)
                    {
                        var vNumber = VehicleManager.Create(client.Name, CarName[id], new Color(0, 0, 0), new Color(0, 0, 0), new Color(0, 0, 0));
                        var house = Houses.HouseManager.GetHouse(client, false);
                        if (house != null)
                        {
                            if (house.GarageID != 0)
                            {
                                var garage = Houses.GarageManager.Garages[house.GarageID];
                                if (VehicleManager.getAllPlayerVehicles(client.Name).Count < Houses.GarageManager.GarageTypes[garage.Type].MaxCars)
                                {
                                    garage.SpawnCar(vNumber);
                                    Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, $"", 3000);
                                }
                            }
                        }
                    }
                    break;
                case 7:
                    Weapons.GiveWeapon(client, ItemType.Bat, "donatejrp");
                    break;
                case 8:
                    Customization.AddClothes(client, ItemType.Mask, 159, 0);
                    break;
                case 9:
                    Main.Players[client].EXP += 10;
                    break;
                case 10:
                    Customization.AddClothes(client, ItemType.Top, 178, 0);
                    Customization.AddClothes(client, ItemType.Leg, 77, 0);
                    Customization.AddClothes(client, ItemType.Feet, 55, 0);
                    break;
                case 11:
                    MoneySystem.Wallet.Change(client, 200000);
                    Log.Write("Деньги пришли в размере 200 000", nLog.Type.Success);
                    break;
                case 12:
                    MoneySystem.Wallet.Change(client, 250000);
                    Log.Write("Деньги пришли в размере 250 000", nLog.Type.Success);
                    break;
                case 13:
                    MoneySystem.Wallet.Change(client, 300000);
                    Log.Write("Деньги пришли в размере 300 000", nLog.Type.Success);
                    break;
                case 14:
                    MoneySystem.Wallet.Change(client, 350000);
                    Log.Write("Деньги пришли в размере 350 000", nLog.Type.Success);
                    break;
                case 15:
                    MoneySystem.Wallet.Change(client, 400000);
                    Log.Write("Деньги пришли в размере 400 000", nLog.Type.Success);
                    break;
                case 16:
                    MoneySystem.Wallet.Change(client, 450000);
                    Log.Write("Деньги пришли в размере 450 000", nLog.Type.Success);
                    break;
                case 17:
                    MoneySystem.Wallet.Change(client, 500000);
                    Log.Write("Деньги пришли в размере 500 000", nLog.Type.Success);
                    break;


            }
        }

        [RemoteEvent("donate")]
        public void MakeDonate(Player client, int id, string data)
        {
            try
            {
                Log.Write($"Data: {id} {data}");
                if (!Main.Accounts.ContainsKey(client)) return;
                Account acc = Main.Accounts[client];
                Type type = (Type)id;

                switch (type)
                {
                    case Type.WheelsRun:
                        {
                            if (Main.Accounts[client].RedBucks < 500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 500;
                            GameLog.Money(acc.Login, "server", 500, "donateChar");
                            Trigger.ClientEvent(client, "WheelsRun");
                            break;
                        }

                    case Type.GiveBox:
                        {
                            int amount = 0;
                            if (!Int32.TryParse(data, out amount))
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Возникла ошибка, попоробуйте еще раз", 3000);
                                return;
                            }
                            amount = Math.Abs(amount);
                            if (amount <= 0)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Введите количество, равное 1 или больше.", 3000);
                                return;
                            }
                            if (Main.Accounts[client].RedBucks < amount * 100)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            var tryAdd = nInventory.TryAdd(client, new nItem(ItemType.Present, 1));
                            if (tryAdd == -1 || tryAdd > 0)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно места в инвентаре", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 100 * amount;
                            GameLog.Money(acc.Login, "server", 100 * amount, "donateChar");
                            nInventory.Add(client, new nItem(ItemType.Present, amount, ""));
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, $"Вы купили {amount} кейсов", 3000);
                            GUI.Dashboard.sendItems(client);
                            break;
                        }
                    case Type.Character:
                        {
                            if (acc.RedBucks < 100)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 100;
                            GameLog.Money(acc.Login, "server", 100, "donateChar");
                            Customization.SendToCreator(client);
                            break;
                        }
                    case Type.Nickname:
                        {
                            if (acc.RedBucks < 25)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }

                            if (!Main.PlayerNames.ContainsValue(client.Name)) return;
                            try
                            {
                                string[] split = data.Split("_");
                                Log.Debug($"SPLIT: {split[0]} {split[1]}");

                                if (split[0] == "null" || string.IsNullOrEmpty(split[0]))
                                {
                                    Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Вы не указали имя!", 3000);
                                    return;
                                }
                                else if (split[1] == "null" || string.IsNullOrEmpty(split[1]))
                                {
                                    Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Вы не указали фамилию!", 3000);
                                    return;
                                }
                            }
                            catch (Exception e)
                            {
                                Log.Write("ERROR ON CHANGENAME DONATION\n" + e.ToString());
                                return;
                            }

                            if (Main.PlayerNames.ContainsValue(data))
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Такое имя уже существует!", 3000);
                                return;
                            }

                            Player target = NAPI.Player.GetPlayerFromName(client.Name);

                            if (target == null || target.IsNull) return;
                            else
                            {
                                Character.toChange.Add(client.Name, data);
                                Main.Accounts[client].RedBucks -= 25;
                                NAPI.Player.KickPlayer(target, "Смена ника");
                            }
                            GameLog.Money(acc.Login, "server", 25, "donateName");
                            break;
                        }
                    case Type.Convert:
                        {
                            int amount = 0;
                            if (!Int32.TryParse(data, out amount))
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Возникла ошибка, попоробуйте еще раз", 3000);
                                return;
                            }
                            amount = Math.Abs(amount);
                            if (amount <= 0)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Введите количество, равное 1 или больше.", 3000);
                                return;
                            }
                            if (Main.Accounts[client].RedBucks < amount)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= amount;
                            GameLog.Money(acc.Login, "server", amount, "donateConvert");
                            amount = amount * 100;
                            MoneySystem.Wallet.Change(client, +amount);
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно перевели RF в {amount}", 3000);
                            GameLog.Money($"donate", $"player({Main.Players[client].UUID})", amount, $"donate");
                            break;
                        }
                    case Type.BronzeVIP:
                        {
                            if (Main.Accounts[client].VipLvl >= 1)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "У вас уже куплен VIP статус!", 3000);
                                return;
                            }
                            if (acc.RedBucks < 300)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 300;
                            GameLog.Money(acc.Login, "server", 300, "donateBVip");
                            Main.Accounts[client].VipLvl = 1;
                            Main.Accounts[client].VipDate = DateTime.Now.AddDays(30);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.SilverVIP:
                        {
                            if (acc.VipLvl >= 1)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "У вас уже куплен VIP статус!", 3000);
                                return;
                            }
                            if (acc.RedBucks < 600)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 600;
                            GameLog.Money(acc.Login, "server", 600, "donateSVip");
                            Main.Accounts[client].VipLvl = 2;
                            Main.Accounts[client].VipDate = DateTime.Now.AddDays(30);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.GoldVIP:
                        {
                            if (Main.Accounts[client].VipLvl >= 1)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "У вас уже куплен VIP статус!", 3000);
                                return;
                            }
                            if (acc.RedBucks < 800)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 800;
                            GameLog.Money(acc.Login, "server", 800, "donateGVip");
                            Main.Accounts[client].VipLvl = 3;
                            Main.Accounts[client].VipDate = DateTime.Now.AddDays(30);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.PlatinumVIP:
                        {
                            if (Main.Accounts[client].VipLvl >= 1)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "У вас уже куплен VIP статус!", 3000);
                                return;
                            }
                            if (acc.RedBucks < 1000)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 1000;
                            GameLog.Money(acc.Login, "server", 1000, "donatePVip");
                            Main.Accounts[client].VipLvl = 4;
                            Main.Accounts[client].VipDate = DateTime.Now.AddDays(30);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Warn:
                        {
                            if (Main.Players[client].Warns <= 0)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "У вас нет Warn'a!", 3000);
                                return;
                            }
                            if (acc.RedBucks < 250)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 250;
                            GameLog.Money(acc.Login, "server", 250, "donateWarn");
                            Main.Players[client].Warns -= 1;
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Slot:
                        {
                            Log.Debug("Unlock slot");
                            if (acc.RedBucks < 1000)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 1000;
                            GameLog.Money(acc.Login, "server", 1000, "donateSlot");

                            if (acc.VipLvl == 0)
                            {
                                Main.Accounts[client].VipLvl = 3;
                                Main.Accounts[client].VipDate = DateTime.Now.AddDays(30);
                            }
                            else if (acc.VipLvl <= 3)
                            {
                                Main.Accounts[client].VipLvl = 3;
                                Main.Accounts[client].VipDate = Main.Accounts[client].VipDate.AddDays(30);
                            }
                            else Main.Accounts[client].VipDate = Main.Accounts[client].VipDate.AddDays(30);

                            Main.Accounts[client].Characters[2] = -1;
                            Trigger.ClientEvent(client, "unlockSlot", Main.Accounts[client].RedBucks);
                            MySQL.Query($"update `accounts` set `redbucks`={Main.Accounts[client].RedBucks} where `login`='{Main.Accounts[client].Login}'");
                            return;
                        }
                    case Type.Money1:
                        {
                            if (acc.RedBucks < 2500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 2500;
                            GameLog.Money(acc.Login, "server", 2500, "donateMoney");
                            MoneySystem.Wallet.Change(client, 100000);
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели $100 000", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Money2:
                        {
                            if (acc.RedBucks < 2500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 2500;
                            GameLog.Money(acc.Login, "server", 2500, "donateMoney");
                            MoneySystem.Wallet.Change(client, 300000);
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели $300 000", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Money3:
                        {
                            if (acc.RedBucks < 2500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 2500;
                            GameLog.Money(acc.Login, "server", 2500, "donateMoney");
                            MoneySystem.Wallet.Change(client, 500000);
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели $500 000", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Money4:
                        {
                            if (acc.RedBucks < 2500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            Main.Accounts[client].RedBucks -= 2500;
                            GameLog.Money(acc.Login, "server", 2500, "donateMoney");
                            MoneySystem.Wallet.Change(client, 1000000);
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели $1 000 000", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Box1:
                        {
                            if (acc.RedBucks < 500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }


                            Main.Accounts[client].RedBucks -= 500;
                            GameLog.Money(acc.Login, "server", 500, "donateBox1");
                            MoneySystem.Wallet.Change(client, 150000000);
                            Main.Players[client].Licenses[1] = true;
                            Main.Players[client].EXP += 10;
                            VehicleManager.Create(client.Name, CarNameS[1], new Color(0, 0, 0), new Color(0, 0, 0), new Color(0, 0, 0));
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели Старт для начала набор", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Box2:
                        {
                            if (acc.RedBucks < 500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }


                            Main.Accounts[client].RedBucks -= 500;
                            GameLog.Money(acc.Login, "server", 500, "donateBox1");
                            MoneySystem.Wallet.Change(client, 150000000);
                            Main.Players[client].Licenses[1] = true;
                            Main.Players[client].EXP += 15;
                            VehicleManager.Create(client.Name, CarNameS[2], new Color(0, 0, 0), new Color(0, 0, 0), new Color(0, 0, 0));
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели Солидненько набор", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Box3:
                        {
                            if (acc.RedBucks < 500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }


                            Main.Accounts[client].RedBucks -= 500;
                            GameLog.Money(acc.Login, "server", 500, "donateBox1");
                            MoneySystem.Wallet.Change(client, 150000000);
                            Main.Players[client].Licenses[1] = true;
                            Main.Players[client].EXP += 20;
                            VehicleManager.Create(client.Name, CarNameS[3], new Color(0, 0, 0), new Color(0, 0, 0), new Color(0, 0, 0));
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели Солидненько набор", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Box4:
                        {
                            if (acc.RedBucks < 500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }


                            Main.Accounts[client].RedBucks -= 500;
                            GameLog.Money(acc.Login, "server", 500, "donateBox1");
                            MoneySystem.Wallet.Change(client, 150000000);
                            Main.Players[client].Licenses[1] = true;
                            Main.Players[client].EXP += 25;
                            VehicleManager.Create(client.Name, CarNameS[4], new Color(0, 0, 0), new Color(0, 0, 0), new Color(0, 0, 0));
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели Золотые запасы набор", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Lic1:
                        {
                            if (acc.RedBucks < 500)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            if (Main.Players[client].Licenses[2])
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, $"У Вас уже есть легковая лицензия", 3000);
                                return;
                            }

                            Main.Accounts[client].RedBucks -= 500;
                            GameLog.Money(acc.Login, "server", 500, "donateBox1");
                            Main.Players[client].Licenses[1] = true;
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели легковую лицензию", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                    case Type.Lic2:
                        {
                            if (acc.RedBucks < 600)
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, "Недостаточно RedBucks!", 3000);
                                return;
                            }
                            if (Main.Players[client].Licenses[2])
                            {
                                Notify.Send(client, NotifyType.Error, NotifyPosition.BottomCenter, $"У Вас уже есть грузовая лицензия", 3000);
                                return;
                            }

                            Main.Accounts[client].RedBucks -= 600;
                            GameLog.Money(acc.Login, "server", 600, "donateBox1");
                            Main.Players[client].Licenses[2] = true;
                            Notify.Send(client, NotifyType.Success, NotifyPosition.BottomCenter, "Вы успешно приобрели грузовую лицензию", 3000);
                            Dashboard.sendStats(client);
                            break;
                        }
                }
                //Log.Write(Main.Players[client.Handle].Starbucks.ToString(), Logger.Type.Debug);
                MySQL.Query($"update `accounts` set `redbucks`={Main.Accounts[client].RedBucks} where `login`='{Main.Accounts[client].Login}'");
                Trigger.ClientEvent(client, "redset", Main.Accounts[client].RedBucks);
            }
            catch (Exception e) { Log.Write("donate: " + e.Message, nLog.Type.Error); }
        }
        #endregion

        public static long SaleEvent(long input)
        {
            if (input < 1000) return input;
            if (input < 3000) return input + (input / 100 * 20);
            if (input < 5000) return input + (input / 100 * 25);
            if (input < 10000) return input + (input / 100 * 30);
            if (input < 14000) return input + (input / 100 * 35);
            if (input >= 14000) return input + (input / 100 * 50);
            // else, but never used
            return input;
        }

        public static void Rename(string Old, string New)
        {
            toChange.Enqueue(
                new KeyValuePair<string, string>(Old, New));
        }
    }
}
